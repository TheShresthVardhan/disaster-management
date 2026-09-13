"""
Landslide Risk Preprocessing Module
=================================================================
Feature preprocessing, encoding, and transformation utilities.
"""
import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any, Tuple, Union
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os
import logging
from app.ai.landslide.config import get_landslide_config
from app.ai.landslide.schemas import (
    LandslideInputFeatures, 
    SoilType, 
    LandCover, 
    Geology,
    LandslideRiskCategory
)

logger = logging.getLogger(__name__)


class LandslidePreprocessor:
    """
    Preprocessing pipeline for landslide risk features.
    Handles missing values, encoding, scaling, and feature engineering.
    """
    
    def __init__(self, config=None):
        self.config = config or get_landslide_config()
        self.scaler: Optional[StandardScaler] = None
        self.imputer: Optional[SimpleImputer] = None
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.onehot_encoders: Dict[str, OneHotEncoder] = {}
        self.feature_columns: List[str] = []
        self.categorical_columns: List[str] = []
        self.numeric_columns: List[str] = []
        self.is_fitted: bool = False
        self.column_transformer: Optional[ColumnTransformer] = None
    
    def _get_feature_columns(self) -> Tuple[List[str], List[str], List[str]]:
        """Identify numeric, categorical, and target columns."""
        # Numeric features
        numeric = [
            'rainfall_1h', 'rainfall_24h', 'rainfall_72h', 'rainfall_7d',
            'soil_moisture', 'slope', 'elevation', 'aspect',
            'vegetation_index', 'soil_depth', 'soil_cohesion',
            'soil_friction_angle', 'soil_permeability',
            'distance_to_fault', 'distance_to_road', 'distance_to_stream',
            'historical_landslides', 'landslide_frequency',
            'temperature', 'humidity', 'wind_speed',
            'latitude', 'longitude'
        ]
        
        # Categorical features
        categorical = [
            'land_cover', 'soil_type', 'geology'
        ]
        
        # Target
        target = ['risk_category']
        
        return numeric, categorical, target
    
    def fit(self, df: pd.DataFrame) -> 'LandslidePreprocessor':
        """
        Fit the preprocessing pipeline on training data.
        
        Args:
            df: Training DataFrame with features and target
            
        Returns:
            Self for chaining
        """
        logger.info("Fitting landslide preprocessor...")
        
        numeric_cols, categorical_cols, target_cols = self._get_feature_columns()
        
        # Identify available columns
        available_numeric = [c for c in self.config.required_features if c in df.columns]
        available_categorical = [c for c in ['land_cover', 'soil_type', 'geology'] if c in df.columns]
        
        self.numeric_columns = [c for c in available_numeric if c in df.columns]
        self.categorical_columns = [c for c in available_categorical if c in df.columns]
        
        logger.info(f"Numeric columns: {self.numeric_columns}")
        logger.info(f"Categorical columns: {self.categorical_columns}")
        
        # Create imputer for numeric features
        strategy = self.config.handle_missing
        self.imputer = SimpleImputer(strategy=strategy)
        
        # Fit imputer on numeric columns
        if self.numeric_columns:
            numeric_data = df[self.numeric_columns]
            self.imputer.fit(numeric_data)
        
        # Fit label encoders for categorical columns
        for col in self.categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                # Fit on non-null values
                non_null = df[col].dropna()
                if len(non_null) > 0:
                    le.fit(non_null)
                    self.label_encoders[col] = le
        
        # Create column transformer for combined preprocessing
        transformers = []
        
        if self.numeric_columns:
            numeric_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy=self.config.handle_missing)),
                ('scaler', StandardScaler())
            ])
            transformers.append(('numeric', numeric_pipeline, self.numeric_columns))
        
        if self.categorical_columns:
            categorical_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('categorical', categorical_pipeline, self.categorical_columns))
        
        if transformers:
            self.column_transformer = ColumnTransformer(
                transformers=transformers,
                remainder='drop'
            )
            # Fit on available data
            available_cols = self.numeric_columns + self.categorical_columns
            available_cols = [c for c in available_cols if c in df.columns]
            if available_cols:
                self.column_transformer.fit(df[available_cols])
        
        self.feature_columns = self._get_output_feature_names()
        self.is_fitted = True
        
        logger.info(f"Preprocessor fitted with {len(self.feature_columns)} output features")
        return self
    
    def _get_output_feature_names(self) -> List[str]:
        """Get output feature names after transformation."""
        names = []
        
        # Numeric features keep their names
        names.extend(self.numeric_columns)
        
        # Categorical features get one-hot encoded names
        for col in self.categorical_columns:
            if col in self.label_encoders:
                le = self.label_encoders[col]
                for cls in le.classes_:
                    names.append(f"{col}_{cls}")
        
        return names
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """
        Transform data using fitted preprocessor.
        
        Args:
            df: DataFrame to transform
            
        Returns:
            Transformed feature matrix
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted. Call fit() first.")
        
        if self.column_transformer is None:
            # Simple path: just impute and scale numeric, encode categorical
            X_parts = []
            
            # Numeric
            if self.numeric_columns:
                numeric_data = df[self.numeric_columns].copy()
                if self.imputer:
                    numeric_data = pd.DataFrame(
                        self.imputer.transform(numeric_data),
                        columns=self.numeric_columns,
                        index=numeric_data.index
                    )
                # Scale if scaler exists
                # (In simple path, we don't have a separate scaler)
                X_parts.append(numeric_data.values)
            
            # Categorical
            for col in self.categorical_columns:
                if col in df.columns and col in self.label_encoders:
                    le = self.label_encoders[col]
                    data = df[col].fillna('unknown').astype(str)
                    # Transform using known classes, unknown -> 0
                    encoded = np.zeros((len(data), len(le.classes_)))
                    for i, val in enumerate(data):
                        if val in le.classes_:
                            idx = np.where(le.classes_ == val)[0][0]
                            encoded[i, idx] = 1
                    X_parts.append(encoded)
            
            if X_parts:
                return np.hstack(X_parts)
            return np.array([]).reshape(len(df), 0)
        
        # Use column transformer
        available_cols = self.numeric_columns + self.categorical_columns
        available_cols = [c for c in available_cols if c in df.columns]
        
        if not available_cols:
            return np.array([]).reshape(len(df), 0)
        
        X_transformed = self.column_transformer.transform(df[available_cols])
        return X_transformed
    
    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Fit and transform in one step."""
        return self.fit(df).transform(df)
    
    def transform_single(self, features: 'LandslideInputFeatures') -> np.ndarray:
        """
        Transform a single LandslideInputFeatures instance.
        
        Args:
            features: LandslideInputFeatures instance
            
        Returns:
            Feature vector as numpy array
        """
        # Convert to DataFrame
        data = features.model_dump()
        df = pd.DataFrame([data])
        return self.transform(df)
    
    def save(self, filepath: str) -> None:
        """Save preprocessor to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'scaler': self.scaler,
            'imputer': self.imputer,
            'label_encoders': self.label_encoders,
            'onehot_encoders': self.onehot_encoders,
            'feature_columns': self.feature_columns,
            'categorical_columns': self.categorical_columns,
            'numeric_columns': self.numeric_columns,
            'is_fitted': self.is_fitted,
            'column_transformer': self.column_transformer,
        }, filepath)
        logger.info(f"Preprocessor saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'LandslidePreprocessor':
        """Load preprocessor from disk."""
        data = joblib.load(filepath)
        preprocessor = cls()
        preprocessor.scaler = data['scaler']
        preprocessor.imputer = data['imputer']
        preprocessor.label_encoders = data['label_encoders']
        preprocessor.onehot_encoders = data['onehot_encoders']
        preprocessor.feature_columns = data['feature_columns']
        preprocessor.categorical_columns = data['categorical_columns']
        preprocessor.numeric_columns = data['numeric_columns']
        preprocessor.is_fitted = data['is_fitted']
        preprocessor.column_transformer = data['column_transformer']
        logger.info(f"Preprocessor loaded from {filepath}")
        return preprocessor


def create_preprocessing_pipeline(config=None) -> Pipeline:
    """
    Create a complete preprocessing pipeline for landslide features.
    
    Args:
        config: Configuration object
        
    Returns:
        Scikit-learn Pipeline
    """
    config = config or get_landslide_config()
    
    numeric_features = [
        'rainfall_1h', 'rainfall_24h', 'rainfall_72h', 'rainfall_7d',
        'soil_moisture', 'slope', 'elevation', 'aspect',
        'vegetation_index', 'soil_depth', 'soil_cohesion',
        'soil_friction_angle', 'soil_permeability',
        'distance_to_fault', 'distance_to_road', 'distance_to_stream',
        'historical_landslides', 'landslide_frequency',
        'temperature', 'humidity', 'wind_speed',
        'latitude', 'longitude'
    ]
    
    categorical_features = ['land_cover', 'soil_type', 'geology']
    
    numeric_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('numeric', numeric_pipeline, numeric_features),
            ('categorical', categorical_pipeline, categorical_features)
        ],
        remainder='drop'
    )
    
    return Pipeline([
        ('preprocessor', preprocessor)
    ])


def encode_categorical_features(
    df: pd.DataFrame,
    columns: List[str],
    encoders: Optional[Dict[str, LabelEncoder]] = None
) -> Tuple[pd.DataFrame, Dict[str, LabelEncoder]]:
    """
    Encode categorical columns using LabelEncoder.
    
    Args:
        df: DataFrame with categorical columns
        columns: List of column names to encode
        encoders: Pre-fitted encoders (optional)
        
    Returns:
        Tuple of (encoded_df, encoders_dict)
    """
    df = df.copy()
    encoders = encoders or {}
    
    for col in columns:
        if col not in df.columns:
            continue
            
        if col not in encoders:
            le = LabelEncoder()
            # Fit on non-null values
            non_null = df[col].dropna()
            if len(non_null) > 0:
                le.fit(non_null)
                encoders[col] = le
        
        if col in encoders:
            le = encoders[col]
            # Transform, handling unknown values
            df[col] = df[col].apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
    
    return df, encoders


def scale_features(
    df: pd.DataFrame,
    columns: List[str],
    scaler: Optional[StandardScaler] = None,
    fit: bool = True
) -> Tuple[pd.DataFrame, StandardScaler]:
    """
    Scale numeric features using StandardScaler.
    
    Args:
        df: DataFrame with numeric columns
        columns: Columns to scale
        scaler: Pre-fitted scaler (optional)
        fit: Whether to fit the scaler
        
    Returns:
        Tuple of (scaled_df, scaler)
    """
    df = df.copy()
    available_cols = [c for c in columns if c in df.columns]
    
    if not available_cols:
        return df, scaler or StandardScaler()
    
    if scaler is None:
        scaler = StandardScaler()
    
    if fit:
        df[available_cols] = scaler.fit_transform(df[available_cols])
    else:
        df[available_cols] = scaler.transform(df[available_cols])
    
    return df, scaler


def handle_missing_values(
    df: pd.DataFrame,
    strategy: str = 'median',
    columns: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Handle missing values in DataFrame.
    
    Args:
        df: Input DataFrame
        strategy: Imputation strategy ('mean', 'median', 'mode', 'constant')
        columns: Columns to impute (None = all numeric)
        
    Returns:
        DataFrame with imputed values
    """
    df = df.copy()
    
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    imputer = SimpleImputer(strategy=strategy)
    df[columns] = imputer.fit_transform(df[columns])
    
    return df


def create_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features for landslide prediction.
    
    Args:
        df: Input DataFrame
        
    Returns:
        DataFrame with additional derived features
    """
    df = df.copy()
    
    # Rainfall ratios
    if 'rainfall_24h' in df.columns and 'rainfall_72h' in df.columns:
        df['rainfall_24h_to_72h'] = df['rainfall_24h'] / (df['rainfall_72h'] + 1e-6)
    
    if 'rainfall_72h' in df.columns and 'rainfall_7d' in df.columns:
        df['rainfall_72h_to_7d'] = df['rainfall_72h'] / (df['rainfall_7d'] + 1e-6)
    
    # Slope categories
    if 'slope' in df.columns:
        df['slope_category'] = pd.cut(
            df['slope'],
            bins=[0, 5, 15, 30, 90],
            labels=['flat', 'gentle', 'moderate', 'steep']
        )
    
    # Elevation categories
    if 'elevation' in df.columns:
        df['elevation_category'] = pd.cut(
            df['elevation'],
            bins=[0, 500, 1500, 3000, 10000],
            labels=['lowland', 'hill', 'mountain', 'high_mountain']
        )
    
    # Rainfall intensity
    if 'rainfall_24h' in df.columns:
        df['rainfall_intensity'] = df['rainfall_24h'] / 24  # mm/hr
    
    # Topographic wetness index approximation
    if 'slope' in df.columns and 'elevation' in df.columns:
        df['topographic_wetness'] = np.log(
            (df['elevation'] + 1) / (np.tan(np.radians(df['slope'])) + 0.001)
        )
    
    return df


def prepare_inference_features(
    features: 'LandslideInputFeatures',
    preprocessor: Optional[LandslidePreprocessor] = None
) -> np.ndarray:
    """
    Prepare features for inference.
    
    Args:
        features: LandslideInputFeatures instance
        preprocessor: Fitted preprocessor (optional)
        
    Returns:
        Feature array ready for model input
    """
    if preprocessor is not None:
        return preprocessor.transform_single(features)
    
    # Manual feature extraction without preprocessor
    data = features.model_dump()
    
    # Convert enums to values
    for key, value in data.items():
        if hasattr(value, 'value'):
            data[key] = value.value
    
    # Create feature vector in expected order
    config = get_landslide_config()
    feature_vector = []
    
    for col in config.required_features:
        val = data.get(col)
        if val is None:
            feature_vector.append(0.0)  # Default for missing
        elif isinstance(val, (int, float)):
            feature_vector.append(float(val))
        else:
            # For categorical, use hash or encoding
            feature_vector.append(hash(str(val)) % 100 / 100.0)
    
    return np.array(feature_vector).reshape(1, -1)


def validate_feature_ranges(features: 'LandslideInputFeatures') -> List[str]:
    """
    Validate feature values are within expected ranges.
    
    Args:
        features: LandslideInputFeatures instance
        
    Returns:
        List of validation warnings
    """
    warnings = []
    data = features.model_dump()
    
    # Check slope
    if data.get('slope', 0) > 60:
        warnings.append(f"Slope {data['slope']}° exceeds typical maximum (60°)")
    
    # Check rainfall
    if data.get('rainfall_24h', 0) > 500:
        warnings.append(f"24h rainfall {data['rainfall_24h']}mm exceeds typical maximum")
    
    # Check soil moisture
    sm = data.get('soil_moisture')
    if sm is not None and (sm < 0 or sm > 1):
        warnings.append(f"Soil moisture {sm} outside valid range [0,1]")
    
    # Check coordinates
    lat = data.get('latitude')
    lon = data.get('longitude')
    if lat is not None and (lat < -90 or lat > 90):
        warnings.append(f"Invalid latitude: {lat}")
    if lon is not None and (lon < -180 or lon > 180):
        warnings.append(f"Invalid longitude: {lon}")
    
    return warnings