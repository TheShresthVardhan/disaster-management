"""
Landslide Risk Data Loading Module
=================================================================
Data loading and preprocessing utilities for landslide risk prediction.
"""
import os
import pandas as pd
import numpy as np
from typing import Optional, Tuple, List, Dict, Any
from pathlib import Path
import logging
from app.ai.landslide.config import get_landslide_config
from app.ai.landslide.schemas import LandslideInputFeatures, LandslideRiskCategory

logger = logging.getLogger(__name__)


class LandslideDataLoader:
    """
    Data loader for landslide risk prediction datasets.
    Handles loading, validation, and basic preprocessing.
    """

    def __init__(self, config=None):
        self.config = config or get_landslide_config()

    def load_csv(self, file_path: str, **kwargs) -> pd.DataFrame:
        """
        Load CSV file with validation.
        
        Args:
            file_path: Path to CSV file
            **kwargs: Additional arguments passed to pd.read_csv
            
        Returns:
            DataFrame with loaded data
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Data file not found: {file_path}")
        
        try:
            df = pd.read_csv(file_path, **kwargs)
            logger.info(f"Loaded {len(df)} records from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Failed to load CSV from {file_path}: {e}")
            raise

    def load_training_data(self, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load training data with required columns validation.
        
        Args:
            file_path: Path to training data CSV
            
        Returns:
            Validated DataFrame with training data
        """
        path = file_path or self.config.raw_data_path
        df = self.load_csv(path)
        
        # Validate required columns
        required_cols = self.config.required_features + [self.config.target_column]
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            logger.warning(f"Missing required columns: {missing_cols}")
            # Don't fail - some columns might be derived during preprocessing
        
        return df

    def validate_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """
        Validate and clean feature data.
        
        Returns:
            Tuple of (cleaned_df, list_of_warnings)
        """
        warnings = []
        df = df.copy()
        
        # Check for missing values in required features
        for col in self.config.required_features:
            if col in df.columns:
                missing_pct = df[col].isnull().mean()
                if missing_pct > 0.5:
                    warnings.append(f"Feature '{col}' has {missing_pct:.1%} missing values")
                elif missing_pct > 0:
                    warnings.append(f"Feature '{col}' has {missing_pct:.1%} missing values")
            else:
                warnings.append(f"Required feature '{col}' not found in data")
        
        # Check target column
        if self.config.target_column in df.columns:
            target_missing = df[self.config.target_column].isnull().sum()
            if target_missing > 0:
                warnings.append(f"Target column has {target_missing} missing values")
                
            # Validate target values
            valid_targets = [cat.value for cat in LandslideRiskCategory]
            invalid_targets = df[self.config.target_column].dropna().unique()
            invalid_targets = [t for t in invalid_targets if t not in valid_targets]
            if invalid_targets:
                warnings.append(f"Invalid target values found: {invalid_targets}")
        else:
            warnings.append(f"Target column '{self.config.target_column}' not found")
        
        # Check for duplicates
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            warnings.append(f"Found {dup_count} duplicate rows")
            df = df.drop_duplicates()
        
        # Check for infinite values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            inf_count = np.isinf(df[col]).sum()
            if inf_count > 0:
                warnings.append(f"Column '{col}' has {inf_count} infinite values")
                df[col] = df[col].replace([np.inf, -np.inf], np.nan)
        
        return df, warnings


def create_synthetic_landslide_data(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Create synthetic landslide data for testing and development.
    DEMO ONLY - NOT REAL DATA.
    
    Args:
        n_samples: Number of samples to generate
        random_state: Random seed for reproducibility
        
    Returns:
        DataFrame with synthetic landslide data
    """
    np.random.seed(random_state)
    
    # Generate base features
    n = n_samples
    
    # Rainfall features - correlated with risk
    rainfall_24h = np.random.exponential(scale=20, size=n)
    rainfall_72h = rainfall_24h + np.random.exponential(scale=15, size=n)
    rainfall_7d = rainfall_72h + np.random.exponential(scale=30, size=n)
    
    # Soil moisture - correlated with rainfall
    soil_moisture = np.clip(
        0.1 + 0.01 * rainfall_72h + np.random.normal(0, 0.1, n),
        0, 1
    )
    
    # Topography
    slope = np.clip(np.random.normal(25, 15, n), 0, 70)
    elevation = np.random.uniform(100, 3000, n)
    aspect = np.random.uniform(0, 360, n)
    
    # Vegetation
    vegetation_index = np.clip(np.random.normal(0.5, 0.3, n), -1, 1)
    land_cover = np.random.choice(
        ['forest', 'grassland', 'agriculture', 'urban', 'barren'],
        size=n,
        p=[0.4, 0.2, 0.15, 0.15, 0.1]
    )
    
    # Soil
    soil_type = np.random.choice(
        ['clay', 'silt', 'sand', 'loam', 'peat', 'rocky'],
        size=n,
        p=[0.2, 0.15, 0.15, 0.3, 0.1, 0.1]
    )
    
    # Geology
    geology = np.random.choice(
        ['sedimentary', 'metamorphic', 'igneous', 'volcanic', 'alluvial'],
        size=n,
        p=[0.3, 0.2, 0.2, 0.15, 0.15]
    )
    
    # Historical landslides
    historical_landslides = np.random.poisson(0.5, n)
    
    # Create risk based on factors (simplified physics-based logic)
    risk_score = (
        0.3 * np.clip(rainfall_72h / 100, 0, 1) +
        0.2 * soil_moisture +
        0.2 * np.clip(slope / 45, 0, 1) +
        0.15 * np.clip(elevation / 2000, 0, 1) +
        0.1 * historical_landslides / 5 +
        0.05 * np.random.random(n)
    )
    
    # Add noise
    risk_score = np.clip(risk_score + np.random.normal(0, 0.1, n), 0, 1)
    
    # Convert to categories
    risk_categories = np.where(
        risk_score < 0.25, 'low',
        np.where(risk_score < 0.5, 'moderate',
        np.where(risk_score < 0.75, 'high', 'critical'))
    )
    
    # Create DataFrame
    data = {
        'rainfall_1h': np.random.exponential(scale=5, size=n),
        'rainfall_24h': rainfall_24h,
        'rainfall_72h': rainfall_72h,
        'rainfall_7d': rainfall_7d,
        'soil_moisture': soil_moisture,
        'slope': slope,
        'elevation': elevation,
        'aspect': aspect,
        'vegetation_index': vegetation_index,
        'land_cover': land_cover,
        'soil_type': soil_type,
        'geology': geology,
        'historical_landslides': historical_landslides,
        'risk_category': risk_categories,
        'risk_score': risk_score,
    }
    
    # Add optional features with some missing values
    df = pd.DataFrame(data)
    
    # Add some missing values randomly
    for col in ['rainfall_1h', 'soil_moisture', 'aspect', 'distance_to_fault']:
        if col in df.columns:
            mask = np.random.random(n) < 0.1
            df.loc[mask, col] = np.nan
    
    # Add location info
    df['latitude'] = np.random.uniform(27, 28, n)  # Sikkim latitude range
    df['longitude'] = np.random.uniform(88, 89, n)  # Sikkim longitude range
    df['location_name'] = [f"Location_{i}" for i in range(n)]
    df['timestamp'] = pd.Timestamp.now()
    
    logger.info(f"Generated {len(df)} synthetic landslide records")
    return df


def load_landslide_dataset(
    file_path: Optional[str] = None,
    use_synthetic: bool = False,
    n_samples: int = 1000
) -> pd.DataFrame:
    """
    Load landslide dataset from file or generate synthetic data.
    
    Args:
        file_path: Path to CSV file (optional)
        use_synthetic: Whether to generate synthetic data
        n_samples: Number of synthetic samples to generate
        
    Returns:
        DataFrame with landslide data
    """
    if use_synthetic or file_path is None:
        logger.info("Generating synthetic landslide data (DEMO MODE)")
        return create_synthetic_landslide_data(n_samples=n_samples)
    
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}, falling back to synthetic data")
        return create_synthetic_landslide_data(n_samples=n_samples)
    
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} records from {file_path}")
        return df
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        logger.info("Falling back to synthetic data")
        return create_synthetic_landslide_data(n_samples=n_samples)


def split_data(
    df: pd.DataFrame,
    target_col: str,
    test_size: float = 0.2,
    validation_size: float = 0.1,
    random_state: int = 42,
    stratify: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split data into train/validation/test sets.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        test_size: Proportion for test set
        validation_size: Proportion for validation set
        random_state: Random seed
        stratify: Whether to stratify by target
        
    Returns:
        Tuple of (train_df, val_df, test_df)
    """
    from sklearn.model_selection import train_test_split
    
    # First split: train+val vs test
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=random_state,
        stratify=df[target_col] if stratify else None
    )
    
    # Second split: train vs validation
    val_size_adjusted = validation_size / (1 - test_size)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=val_size_adjusted,
        random_state=random_state,
        stratify=train_val_df[target_col] if stratify else None
    )
    
    logger.info(f"Data split: train={len(train_df)}, val={len(val_df)}, test={len(test_df)}")
    return train_df, val_df, test_df


def prepare_features_and_target(
    df: pd.DataFrame,
    target_col: str,
    feature_cols: Optional[List[str]] = None
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Prepare feature matrix and target vector for training.
    
    Args:
        df: Input DataFrame
        target_col: Target column name
        feature_cols: List of feature columns to use (None = auto-detect)
        
    Returns:
        Tuple of (X, y, feature_names)
    """
    if feature_cols is None:
        # Auto-detect numeric and categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Remove target from features
        feature_cols = [c for c in numeric_cols if c != target_col]
        # For categorical, we'll need encoding
        cat_features = [c for c in categorical_cols if c != target_col]
        
        logger.info(f"Numeric features: {len(feature_cols)}, Categorical: {len(cat_features)}")
    
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    return X.values, y.values, feature_cols


def save_processed_data(df: pd.DataFrame, output_path: str) -> None:
    """Save processed data to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    logger.info(f"Saved processed data to {output_path}")


def load_landslide_config() -> Dict[str, Any]:
    """Load landslide configuration from config module."""
    from app.ai.landslide.config import get_landslide_config
    config = get_landslide_config()
    return {
        'required_features': config.required_features,
        'optional_features': config.optional_features,
        'target_column': config.target_column,
        'risk_categories': config.risk_categories,
        'risk_thresholds': config.risk_thresholds,
        'model_params': {
            'n_estimators': config.n_estimators,
            'max_depth': config.max_depth,
            'min_samples_split': config.min_samples_split,
            'min_samples_leaf': config.min_samples_leaf,
            'max_features': config.max_features,
            'class_weight': config.class_weight,
        }
    }