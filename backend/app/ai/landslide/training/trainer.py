"""
Landslide Risk Training Module
=================================================================
Training pipeline for landslide risk prediction models.
"""
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
import joblib
import os
import logging
import time
from datetime import datetime

from app.ai.landslide.config import get_landslide_config
from app.ai.landslide.data.loader import (
    load_landslide_dataset, 
    split_data, 
    prepare_features_and_target,
    create_synthetic_landslide_data
)
from app.ai.landslide.preprocessing.processor import LandslidePreprocessor
from app.ai.landslide.models import (
    RandomForestLandslideModel,
    DemoLandslideModel,
    get_landslide_model
)
from app.ai.landslide.schemas import LandslideRiskCategory

logger = logging.getLogger(__name__)


@dataclass
class TrainingResult:
    """Training results container."""
    success: bool
    model: Any = None
    preprocessor: Any = None
    metrics: Dict[str, Any] = None
    error: Optional[str] = None
    training_time_seconds: float = 0.0
    model_path: Optional[str] = None
    preprocessor_path: Optional[str] = None


def train_landslide_model(
    config=None,
    data_path: Optional[str] = None,
    use_synthetic: bool = False,
    n_synthetic_samples: int = 5000,
    model_type: Optional[str] = None,
    save_model: bool = True,
    output_dir: Optional[str] = None
) -> TrainingResult:
    """
    Complete training pipeline for landslide risk model.
    
    Args:
        config: Configuration object
        data_path: Path to training data CSV
        use_synthetic: Whether to generate synthetic data
        n_synthetic_samples: Number of synthetic samples if using synthetic data
        model_type: Model type to train
        save_model: Whether to save trained model
        output_dir: Directory to save model and preprocessor
        
    Returns:
        TrainingResult with model, metrics, and paths
    """
    config = config or get_landslide_config()
    model_type = model_type or config.model_type
    output_dir = output_dir or config.model_dir
    start_time = time.time()
    
    try:
        logger.info(f"Starting landslide model training (type: {model_type})")
        
        # Load or generate data
        logger.info("Loading dataset...")
        df = load_landslide_dataset(
            file_path=data_path,
            use_synthetic=use_synthetic,
            n_samples=n_synthetic_samples
        )
        
        logger.info(f"Dataset loaded: {len(df)} samples, {len(df.columns)} columns")
        
        # Split data
        target_col = config.target_column
        train_df, val_df, test_df = split_data(
            df,
            target_col=target_col,
            test_size=config.test_size,
            validation_size=config.validation_size,
            random_state=config.random_state
        )
        
        logger.info(f"Data split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        
        # Create and fit preprocessor
        logger.info("Fitting preprocessor...")
        preprocessor = LandslidePreprocessor(config)
        preprocessor.fit(train_df)
        
        # Transform data
        X_train = preprocessor.transform(train_df)
        y_train = train_df[config.target_column].values
        
        X_val = preprocessor.transform(val_df)
        y_val = val_df[config.target_column].values
        
        X_test = preprocessor.transform(test_df)
        y_test = test_df[config.target_column].values
        
        logger.info(f"Feature matrix shapes - Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
        
        # Create and train model
        logger.info(f"Creating model of type: {model_type}")
        model = get_landslide_model(model_type, config)
        
        # Train model
        train_start = time.time()
        metrics = model.train(
            X=train_df.values if hasattr(model, 'preprocessor') else None,
            y=y_train,
            validation_data=(val_df.values, y_val) if val_df is not None else None
        )
        train_time = time.time() - train_start
        
        # Evaluate on test set
        logger.info("Evaluating on test set...")
        test_pred = model.predict(test_df.values if hasattr(model, 'preprocessor') else None)
        
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        test_accuracy = accuracy_score(y_test, test_pred)
        test_precision = precision_score(y_test, test_pred, average='weighted', zero_division=0)
        test_recall = recall_score(y_test, test_pred, average='weighted', zero_division=0)
        test_f1 = f1_score(y_test, test_pred, average='weighted', zero_division=0)
        
        # Compile final metrics
        final_metrics = {
            **metrics,
            'test_accuracy': test_accuracy,
            'test_precision': test_precision,
            'test_recall': test_recall,
            'test_f1': test_f1,
            'train_time_seconds': train_time,
            'total_time_seconds': time.time() - start_time,
            'n_train': len(train_df),
            'n_val': len(val_df),
            'n_test': len(test_df),
            'n_features': len(model.feature_names) if hasattr(model, 'feature_names') else 0,
            'model_type': model_type,
            'is_demo': model.is_demo,
        }
        
        logger.info(f"Test Accuracy: {test_accuracy:.4f}, F1: {test_f1:.4f}")
        
        # Save model and preprocessor
        model_path = None
        preprocessor_path = None
        
        if save_model:
            os.makedirs(output_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_filename = f"landslide_model_{model_type}_{timestamp}.pkl"
            preprocessor_filename = f"landslide_preprocessor_{timestamp}.pkl"
            
            model_path = os.path.join(output_dir, model_filename)
            preprocessor_path = os.path.join(output_dir, preprocessor_filename)
            
            # Save model
            model.save(model_path)
            
            # Save preprocessor
            preprocessor.save(preprocessor_path)
            
            # Save feature names and config
            meta_path = os.path.join(output_dir, f"model_meta_{timestamp}.json")
            import json
            meta = {
                'model_type': model_type,
                'version': '1.0.0',
                'feature_names': list(model.feature_names) if hasattr(model, 'feature_names') else [],
                'target_classes': list(model.classes_) if hasattr(model, 'classes_') else [],
                'config': {
                    'model_type': model_type,
                    'test_size': config.test_size,
                    'validation_size': config.validation_size,
                    'random_state': config.random_state,
                },
                'metrics': {k: v for k, v in metrics.items() if not isinstance(v, dict)},
                'trained_at': datetime.utcnow().isoformat(),
            }
            with open(meta_path, 'w') as f:
                json.dump(meta, f, indent=2)
            
            logger.info(f"Model saved to {model_path}")
            logger.info(f"Preprocessor saved to {preprocessor_path}")
        
        total_time = time.time() - start_time
        
        return TrainingResult(
            success=True,
            model=model,
            preprocessor=preprocessor,
            metrics=final_metrics,
            training_time_seconds=total_time,
            model_path=model_path,
            preprocessor_path=preprocessor_path,
        )
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        return TrainingResult(
            success=False,
            error=str(e),
            training_time_seconds=time.time() - start_time,
        )


def evaluate_model(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    class_names: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Comprehensive model evaluation.
    
    Args:
        model: Trained model
        X_test: Test features
        y_test: True labels
        class_names: Class names for reporting
        
    Returns:
        Dictionary with evaluation metrics
    """
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        classification_report, confusion_matrix, roc_auc_score
    )
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision_macro': precision_score(y_test, y_pred, average='macro', zero_division=0),
        'precision_weighted': precision_score(y_test, y_pred, average='weighted', zero_division=0),
        'recall_macro': recall_score(y_test, y_pred, average='macro', zero_division=0),
        'recall_weighted': recall_score(y_test, y_pred, average='weighted', zero_division=0),
        'f1_macro': f1_score(y_test, y_pred, average='macro', zero_division=0),
        'f1_weighted': f1_score(y_test, y_pred, average='weighted', zero_division=0),
    }
    
    # Per-class metrics
    if class_names:
        report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True, zero_division=0)
        metrics['per_class'] = report
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    metrics['confusion_matrix'] = cm.tolist()
    
    # ROC-AUC if probabilities available
    if y_proba is not None:
        try:
            if len(np.unique(y_test)) == 2:
                metrics['roc_auc'] = roc_auc_score(y_test, y_proba[:, 1])
            else:
                metrics['roc_auc_ovr'] = roc_auc_score(y_test, y_proba, multi_class='ovr')
                metrics['roc_auc_ovo'] = roc_auc_score(y_test, y_proba, multi_class='ovo')
        except Exception as e:
            logger.warning(f"Could not compute ROC-AUC: {e}")
    
    return metrics


def cross_validate_model(
    model_class: type,
    X: np.ndarray,
    y: np.ndarray,
    cv_folds: int = 5,
    config=None,
    **model_kwargs
) -> Dict[str, Any]:
    """
    Perform cross-validation for model evaluation.
    
    Args:
        model_class: Model class to instantiate
        X: Feature matrix
        y: Target labels
        cv_folds: Number of CV folds
        config: Configuration object
        **model_kwargs: Additional model arguments
        
    Returns:
        Dictionary with CV results
    """
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    config = config or get_landslide_config()
    
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=config.random_state)
    
    # Accuracy CV
    accuracy_scores = cross_val_score(
        model_class(config), X, y, cv=cv, scoring='accuracy', n_jobs=-1
    )
    
    # Detailed per-fold metrics
    fold_metrics = []
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=config.random_state)
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_fold_train, X_fold_val = X[train_idx], X[val_idx]
        y_fold_train, y_fold_val = y[train_idx], y[val_idx]
        
        model = get_landslide_model(config.model_type, config)
        model.train(X_fold_train, y_fold_train)
        
        y_pred = model.predict(X_fold_val)
        
        fold_metrics = {
            'fold': fold + 1,
            'accuracy': accuracy_score(y_fold_val, y_pred),
            'precision': precision_score(y_fold_val, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_fold_val, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_fold_val, y_pred, average='weighted', zero_division=0),
        }
        fold_metrics.append(fold_metrics)
    
    return {
        'cv_accuracy_mean': np.mean(accuracy_scores),
        'cv_accuracy_std': np.std(accuracy_scores),
        'cv_accuracy_scores': accuracy_scores.tolist(),
        'fold_metrics': fold_metrics,
        'mean_f1': np.mean([m['f1'] for m in fold_metrics]),
        'mean_precision': np.mean([m['precision'] for m in fold_metrics]),
        'mean_recall': np.mean([m['recall'] for m in fold_metrics]),
    }


def hyperparameter_tuning(
    X: np.ndarray,
    y: np.ndarray,
    param_grid: Dict[str, List[Any]],
    config=None,
    cv_folds: int = 3,
    n_iter: int = 20,
    scoring: str = 'f1_weighted'
) -> Dict[str, Any]:
    """
    Hyperparameter tuning using RandomizedSearchCV.
    
    Args:
        X: Feature matrix
        y: Target labels
        param_grid: Parameter grid to search
        config: Configuration object
        cv_folds: CV folds
        n_iter: Number of iterations
        scoring: Scoring metric
        
    Returns:
        Best parameters and best score
    """
    from sklearn.model_selection import RandomizedSearchCV
    from sklearn.ensemble import RandomForestClassifier
    
    config = config or get_landslide_config()
    
    # Base model
    base_model = RandomForestClassifier(
        random_state=config.random_state,
        n_jobs=config.n_jobs,
        class_weight=config.class_weight
    )
    
    # Randomized search
    search = RandomizedSearchCV(
        base_model,
        param_distributions=param_grid,
        n_iter=n_iter,
        cv=3,
        scoring=scoring,
        n_jobs=-1,
        random_state=config.random_state,
        verbose=1
    )
    
    search.fit(X, y)
    
    logger.info(f"Best params: {search.best_params_}")
    logger.info(f"Best score: {search.best_score_:.4f}")
    
    return {
        'best_params': search.best_params_,
        'best_score': search.best_score_,
        'best_estimator': search.best_estimator_,
        'cv_results': search.cv_results_
    }


def train_demo_model(config=None) -> TrainingResult:
    """
    Train a demo model for testing purposes.
    
    Args:
        config: Configuration object
        
    Returns:
        TrainingResult with demo model
    """
    config = config or get_landslide_config()
    config.model_type = 'demo'
    
    logger.info("Training demo model (no real training)...")
    
    model = DemoLandslideModel(config)
    
    # Generate synthetic data for demo
    df = create_synthetic_landslide_data(n_samples=100)
    target_col = 'risk_category'
    
    train_df, val_df, test_df = split_data(df, target_col=target_col)
    
    # Mock training
    metrics = model.train(train_df.values, train_df[target_col].values)
    
    return TrainingResult(
        success=True,
        model=model,
        metrics=metrics,
        training_time_seconds=0.1,
    )


def run_training_pipeline(
    data_path: Optional[str] = None,
    model_type: Optional[str] = None,
    use_synthetic: bool = True,
    n_samples: int = 5000,
    output_dir: Optional[str] = None,
    config=None
) -> TrainingResult:
    """
    Run the complete training pipeline.
    
    This is the main entry point for training.
    
    Args:
        data_path: Path to training data
        model_type: Model type to train
        use_synthetic: Whether to use synthetic data
        n_samples: Number of synthetic samples
        output_dir: Output directory for model artifacts
        config: Configuration object
        
    Returns:
        TrainingResult
    """
    config = config or get_landslide_config()
    
    if output_dir:
        config.model_dir = output_dir
    
    if model_type:
        config.model_type = model_type
    
    return train_landslide_model(
        config=config,
        data_path=data_path,
        use_synthetic=use_synthetic,
        n_synthetic_samples=n_samples,
        model_type=config.model_type,
        save_model=True,
        output_dir=config.model_dir
    )


def load_trained_model(
    model_path: str,
    preprocessor_path: Optional[str] = None
) -> Tuple[Any, Optional[LandslidePreprocessor]]:
    """
    Load a trained model and optional preprocessor.
    
    Args:
        model_path: Path to model file
        preprocessor_path: Path to preprocessor file (optional)
        
    Returns:
        Tuple of (model, preprocessor)
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    # Determine model type from filename or metadata
    model = joblib.load(model_path)
    
    preprocessor = None
    if preprocessor_path and os.path.exists(preprocessor_path):
        preprocessor = LandslidePreprocessor.load(preprocessor_path)
    
    logger.info(f"Loaded model from {model_path}")
    return model, preprocessor


def run_training_from_cli(args) -> TrainingResult:
    """
    Run training from command line arguments.
    
    Args:
        args: Parsed command line arguments
        
    Returns:
        TrainingResult
    """
    return run_training_pipeline(
        data_path=args.data_path,
        model_type=args.model_type,
        use_synthetic=args.use_synthetic,
        n_samples=args.n_samples,
        output_dir=args.output_dir,
    )