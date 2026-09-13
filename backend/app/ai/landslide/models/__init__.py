"""
Landslide Risk Models
=================================================================
Model implementations for landslide risk prediction.
"""
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List, Tuple
from abc import ABC, abstractmethod
import joblib
import os
import logging
from app.ai.landslide.config import get_landslide_config
# Import SeverityLevel from main AI schemas
from app.ai.schemas import SeverityLevel
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskResult,
    LandslideRiskCategory,
    SoilType,
    LandCover,
    Geology
)
from app.ai.landslide.preprocessing.processor import LandslidePreprocessor

logger = logging.getLogger(__name__)


class LandslideModelBase(ABC):
    """
    Abstract base class for landslide risk models.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        pass
    
    @property
    @abstractmethod
    def is_demo(self) -> bool:
        pass
    
    @abstractmethod
    def train(self, X: np.ndarray, y: np.ndarray, **kwargs) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        pass
    
    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        pass
    
    @abstractmethod
    def predict_with_features(self, features: 'LandslideInputFeatures') -> 'LandslideRiskResult':
        pass
    
    @abstractmethod
    def save(self, filepath: str) -> None:
        pass
    
    @classmethod
    @abstractmethod
    def load(cls, filepath: str) -> 'LandslideModelBase':
        pass


class RandomForestLandslideModel:
    """
    Random Forest based landslide risk prediction model.
    """
    
    name = "random_forest"
    version = "1.0.0"
    is_demo = False
    
    def __init__(self, config=None):
        self.config = config or get_landslide_config()
        self.model = None
        self.preprocessor = None
        self.feature_names = []
        self.classes_ = None
        self.is_trained = False
        
        # Model parameters from config
        self.model_params = {
            'n_estimators': self.config.n_estimators,
            'max_depth': self.config.max_depth,
            'min_samples_split': self.config.min_samples_split,
            'min_samples_leaf': self.config.min_samples_leaf,
            'max_features': self.config.max_features,
            'class_weight': self.config.class_weight,
            'random_state': self.config.random_state,
            'n_jobs': self.config.n_jobs,
            'verbose': self.config.verbose,
        }
    
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: Optional[List[str]] = None,
        validation_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the Random Forest model.
        
        Args:
            X: Training features
            y: Training labels
            feature_names: Feature names for interpretability
            validation_data: Optional validation data (X_val, y_val)
            
        Returns:
            Dictionary with training metrics
        """
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import cross_val_score, StratifiedKFold
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            classification_report, confusion_matrix, roc_auc_score
        )
        
        logger.info(f"Training Random Forest with {X.shape[0]} samples, {X.shape[1]} features")
        
        # Initialize model
        self.model = RandomForestClassifier(**self.model_params)
        
        # Train
        self.model.fit(X, y)
        self.is_trained = True
        self.feature_names = feature_names or [f"feature_{i}" for i in range(X.shape[1])]
        self.classes_ = self.model.classes_
        
        # Training predictions
        train_pred = self.model.predict(X)
        train_proba = self.model.predict_proba(X)
        
        # Calculate training metrics
        train_accuracy = accuracy_score(y, train_pred)
        train_precision = precision_score(y, train_pred, average='weighted', zero_division=0)
        train_recall = recall_score(y, train_pred, average='weighted', zero_division=0)
        train_f1 = f1_score(y, train_pred, average='weighted', zero_division=0)
        
        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(self.model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
        
        # Validation metrics if provided
        val_metrics = {}
        if validation_data:
            X_val, y_val = validation_data
            val_pred = self.model.predict(validation_data[0])
            val_accuracy = accuracy_score(y_val, val_pred)
            val_precision = precision_score(y_val, val_pred, average='weighted', zero_division=0)
            val_recall = recall_score(y_val, val_pred, average='weighted', zero_division=0)
            val_f1 = f1_score(y_val, val_pred, average='weighted', zero_division=0)
            val_metrics = {
                'val_accuracy': val_accuracy,
                'val_precision': val_precision,
                'val_recall': val_recall,
                'val_f1': val_f1,
            }
        
        # Feature importance
        feature_importance = dict(zip(
            self.feature_names or [f"feature_{i}" for i in range(X.shape[1])],
            self.model.feature_importances_
        ))
        
        metrics = {
            'train_accuracy': train_accuracy,
            'train_precision': train_precision,
            'train_recall': train_recall,
            'train_f1': train_f1,
            'cv_accuracy_mean': cv_scores.mean(),
            'cv_accuracy_std': cv_scores.std(),
            'feature_importance': feature_importance,
            **val_metrics
        }
        
        logger.info(f"Training complete - Accuracy: {train_accuracy:.4f}, CV: {cv_scores.mean():.4f}±{cv_scores.std():.4f}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict risk categories."""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        return self.model.predict(X)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probabilities."""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        return self.model.predict_proba(X)
    
    def predict_with_features(self, features: 'LandslideInputFeatures') -> 'LandslideRiskResult':
        """
        Predict risk for a single feature set.
        
        Args:
            features: LandslideInputFeatures instance
            
        Returns:
            LandslideRiskResult with prediction
        """
        # Use preprocessor if available
        if hasattr(self, 'preprocessor') and self.preprocessor:
            X = self.preprocessor.transform_single(features)
        else:
            # Manual feature extraction
            X = self._features_to_array(features).reshape(1, -1)
        
        # Predict
        pred = self.predict(X.reshape(1, -1))[0]
        proba = self.predict_proba(X.reshape(1, -1))[0]
        
        # Get risk category
        risk_category = LandslideRiskCategory(pred)
        
        # Get probabilities
        class_probas = dict(zip(self.classes_, proba))
        
        # Calculate confidence as max probability
        confidence = float(np.max(proba))
        
        # Generate risk assessment
        risk_factors = self._generate_risk_factors(features)
        infrastructure_at_risk = self._get_infrastructure_at_risk(pred)
        recommended_actions = self._get_recommended_actions(pred)
        
        return LandslideRiskResult(
            risk_category=risk_category,
            risk_score=float(np.max(proba)),
            confidence=confidence,
            risk_probabilities=class_probas,
            risk_factors=risk_factors,
            infrastructure_at_risk=infrastructure_at_risk,
            recommended_actions=recommended_actions,
            model_version=self.version,
            processing_time_ms=0,  # Will be set by caller
            is_demo=False
        )
    
    def _features_to_array(self, features: 'LandslideInputFeatures') -> np.ndarray:
        """Convert features to array in correct order."""
        config = get_landslide_config()
        feature_vector = []
        
        data = features.model_dump()
        
        for col in config.required_features:
            val = data.get(col)
            if val is None:
                feature_vector.append(0.0)
            elif hasattr(val, 'value'):
                feature_vector.append(float(val.value))
            elif isinstance(val, (int, float)):
                feature_vector.append(float(val))
            else:
                feature_vector.append(0.0)
        
        return np.array(feature_vector)
    
    def _generate_risk_factors(self, features: 'LandslideInputFeatures') -> List[str]:
        """Generate human-readable risk factors."""
        factors = []
        data = features.model_dump()
        
        if features.rainfall_72h and features.rainfall_72h > 100:
            factors.append(f"Heavy 72h rainfall ({features.rainfall_72h:.1f}mm)")
        
        if features.soil_moisture and features.soil_moisture > 0.8:
            factors.append(f"High soil moisture ({features.soil_moisture:.0%})")
        
        if features.slope and features.slope > 30:
            factors.append(f"Steep slope ({features.slope}°)")
        
        if features.historical_landslides and features.historical_landslides > 0:
            factors.append(f"{features.historical_landslides} historical landslides in area")
        
        if features.vegetation_index is not None and features.vegetation_index < 0.2:
            factors.append("Low vegetation cover")
        
        if features.soil_type in [SoilType.CLAY, SoilType.SILT]:
            factors.append(f"{features.soil_type.value} soil prone to instability")
        
        return factors
    
    def _get_infrastructure_at_risk(self, risk_category: str) -> List[str]:
        """Get infrastructure at risk based on category."""
        risk_map = {
            'low': ['Minimal infrastructure at risk'],
            'moderate': ['Local roads', 'Small structures'],
            'high': ['Major roads', 'Buildings', 'Utilities', 'Bridges'],
            'critical': ['All infrastructure', 'Major highways', 'Critical facilities', 'Communications']
        }
        return risk_map.get(risk_category, ['Unknown'])
    
    def _get_recommended_actions(self, risk_category: str) -> List[str]:
        """Get recommended actions for risk category."""
        actions_map = {
            'low': ['Monitor conditions', 'Maintain drainage'],
            'moderate': ['Increase monitoring', 'Clear drainage', 'Alert local authorities'],
            'high': ['Evacuate high-risk zones', 'Deploy emergency teams', 'Close affected roads'],
            'critical': ['Immediate evacuation', 'Emergency response activation', 'Deploy all resources']
        }
        return actions_map.get(risk_category, ['Monitor situation'])
    
    def get_feature_importance(self, top_n: int = 10) -> Dict[str, float]:
        """Get top N feature importances."""
        if not self.is_trained:
            return {}
        
        importance = dict(zip(self.feature_names, self.model.feature_importances_))
        sorted_importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
        return dict(list(sorted_importance.items())[:top_n])
    
    def save(self, filepath: str) -> None:
        """Save model to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'preprocessor': self.preprocessor,
            'feature_names': self.feature_names,
            'classes_': self.classes_,
            'is_trained': self.is_trained,
            'model_params': self.model_params,
            'version': self.version,
        }, filepath)
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'RandomForestLandslideModel':
        """Load model from disk."""
        data = joblib.load(filepath)
        instance = cls()
        instance.model = data['model']
        instance.preprocessor = data.get('preprocessor')
        instance.feature_names = data['feature_names']
        instance.classes_ = data['classes_']
        instance.is_trained = data['is_trained']
        instance.model_params = data['model_params']
        instance.version = data.get('version', '1.0.0')
        logger.info(f"Model loaded from {filepath}")
        return instance


class GradientBoostingLandslideModel:
    """
    Gradient Boosting (XGBoost/LightGBM) landslide risk model.
    Placeholder for future implementation.
    """
    
    name = "gradient_boosting"
    version = "1.0.0"
    is_demo = False
    
    def __init__(self, config=None):
        self.config = config or get_landslide_config()
        self.model = None
        self.is_trained = False
    
    def train(self, X: np.ndarray, y: np.ndarray, **kwargs) -> Dict[str, Any]:
        # Placeholder for XGBoost/LightGBM implementation
        raise NotImplementedError("Gradient Boosting model not yet implemented")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError()
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError()
    
    def save(self, filepath: str) -> None:
        raise NotImplementedError()
    
    @classmethod
    def load(cls, filepath: str) -> 'GradientBoostingLandslideModel':
        raise NotImplementedError()


class DemoLandslideModel:
    """
    DEMO/MOCK Landslide Risk Model
    =================================================================
    ⚠️  THIS IS A DEMONSTRATION/MOCK PROVIDER - NOT A TRAINED MODEL
    =================================================================
    
    This provider exists ONLY to test the AI pipeline without a trained model.
    It returns deterministic, rule-based outputs based on simple keyword matching
    and should NEVER be used for real disaster response decisions.
    
    DO NOT:
    - Present outputs as real AI predictions
    - Use confidence values as genuine model certainty
    - Deploy in production without replacing with a trained model
    
    USE FOR:
    - Testing the AI pipeline end-to-end
    - Frontend integration development
    - Pipeline debugging
    
    REPLACEMENT:
    Replace with a real trained model (sklearn, PyTorch, TensorFlow, ONNX, etc.)
    in Phase 5B or later by implementing a new IncidentAIProvider subclass.
    """
    
    name = "demo"
    version = "demo-v1"
    is_demo = True
    
    def __init__(self, config=None):
        self.config = config or get_landslide_config()
    
    def train(self, X: np.ndarray, y: np.ndarray, **kwargs) -> Dict[str, Any]:
        """Mock training - returns dummy metrics."""
        logger.warning("Demo model training - returning mock metrics")
        return {
            'train_accuracy': 0.85,
            'train_precision': 0.82,
            'train_recall': 0.80,
            'train_f1': 0.81,
            'cv_accuracy_mean': 0.83,
            'cv_accuracy_std': 0.03,
            'feature_importance': {
                'rainfall_72h': 0.30,
                'soil_moisture': 0.25,
                'slope': 0.20,
                'elevation': 0.10,
                'historical_landslides': 0.15
            },
            'note': 'DEMO MODE - Not a real trained model'
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict using simple heuristics."""
        n_samples = X.shape[0]
        predictions = []
        
        for i in range(n_samples):
            # Simple heuristic based on feature values
            # Assuming features are in standard order
            risk_score = 0.0
            
            # Simple heuristic: if we have meaningful feature values
            if X.shape[1] >= 5:
                # rainfall_72h (index 2), soil_moisture (4), slope (5)
                rainfall = X[i, 2] if X.shape[1] > 2 else 0
                soil_moisture = X[i, 4] if X.shape[1] > 4 else 0
                slope = X[i, 5] if X.shape[1] > 5 else 0
                
                # Simple scoring
                score = (rainfall / 200) * 0.3 + soil_moisture * 0.3 + (slope / 45) * 0.2
                score = min(1.0, score + np.random.normal(0, 0.1))
            else:
                score = np.random.uniform(0.2, 0.6)
            
            if score < 0.25:
                pred = 'low'
            elif score < 0.5:
                pred = 'moderate'
            elif score < 0.75:
                pred = 'high'
            else:
                pred = 'critical'
            
            predictions.append(pred)
        
        return np.array(predictions)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return mock probabilities."""
        n_samples = X.shape[0]
        n_classes = 4  # low, moderate, high, critical
        probas = np.random.dirichlet([1, 1, 1, 1], n_samples)
        
        # Boost the predicted class
        preds = self.predict(X)
        class_to_idx = {'low': 0, 'moderate': 1, 'high': 2, 'critical': 3}
        for i, pred in enumerate(predictions):
            idx = class_to_idx.get(pred, 1)
            probas[i] = probas[i] * 0.5
            probas[i, idx] += 0.5
            probas[i] = probas[i] / probas[i].sum()
        
        return probas
    
    def predict_with_features(self, features: 'LandslideInputFeatures') -> 'LandslideRiskResult':
        """Predict risk for a single feature set (demo mode)."""
        from app.ai.landslide.schemas import LandslideRiskResult
        
        # Simple rule-based assessment
        risk_score = 0.0
        factors = []
        
        if features.rainfall_72h and features.rainfall_72h > 100:
            risk_score += 0.3
            factors.append(f"Heavy 72h rainfall ({features.rainfall_72h:.1f}mm)")
        
        if features.soil_moisture and features.soil_moisture > 0.8:
            risk_score += 0.25
            factors.append(f"High soil moisture ({features.soil_moisture:.0%})")
        
        if features.slope and features.slope > 30:
            risk_score += 0.2
            factors.append(f"Steep slope ({features.slope}°)")
        
        if features.historical_landslides and features.historical_landslides > 0:
            risk_score += 0.15
            factors.append(f"{features.historical_landslides} historical landslides")
        
        if features.vegetation_index is not None and features.vegetation_index < 0.2:
            risk_score += 0.1
            factors.append("Low vegetation cover")
        
        risk_score = min(1.0, risk_score + np.random.uniform(-0.05, 0.05))
        
        if risk_score < 0.25:
            category = LandslideRiskCategory.LOW
        elif risk_score < 0.5:
            category = LandslideRiskCategory.MODERATE
        elif risk_score < 0.75:
            category = LandslideRiskCategory.HIGH
        else:
            category = LandslideRiskCategory.CRITICAL
        
        # Generate mock probabilities
        probs = {c.value: 0.1 for c in LandslideRiskCategory}
        probs[category.value] = risk_score + 0.2
        
        # Normalize
        total = sum(probs.values())
        probs = {k: v/total for k, v in probs.items()}
        
        return LandslideRiskResult(
            risk_category=category,
            risk_score=risk_score,
            confidence=0.65,  # Fixed demo confidence
            risk_probabilities=probs,
            risk_factors=factors,
            recommended_actions=self._get_recommended_actions(category.value),
            model_version=self.version,
            processing_time_ms=0,
            is_demo=True
        )
    
    def _get_recommended_actions(self, category: str) -> List[str]:
        actions_map = {
            'low': ['Monitor conditions', 'Maintain drainage'],
            'moderate': ['Increase monitoring', 'Clear drainage', 'Alert local authorities'],
            'high': ['Evacuate high-risk zones', 'Deploy emergency teams', 'Close affected roads'],
            'critical': ['Immediate evacuation', 'Emergency response activation', 'Deploy all resources']
        }
        return actions_map.get(category, ['Monitor situation'])
    
    def save(self, filepath: str) -> None:
        pass  # No-op for demo
    
    @classmethod
    def load(cls, filepath: str) -> 'DemoLandslideModel':
        return cls()


class LandslideModelFactory:
    """Factory for creating landslide risk models."""
    
    _models = {
        'random_forest': RandomForestLandslideModel,
        'gradient_boosting': GradientBoostingLandslideModel,
        'demo': DemoLandslideModel,
    }
    
    @classmethod
    def create(cls, model_type: str, config=None) -> Any:
        """
        Create a model instance by type.
        
        Args:
            model_type: Model type ('random_forest', 'gradient_boosting', 'demo')
            config: Configuration object
            
        Returns:
            Model instance
        """
        if model_type not in cls._models:
            raise ValueError(f"Unknown model type: {model_type}. Available: {list(cls._models.keys())}")
        
        model_class = cls._models[model_type]
        
        # Demo model doesn't accept config parameter
        if model_type == 'demo':
            return model_class()
        
        return model_class(config)
    
    @classmethod
    def register(cls, name: str, model_class: type) -> None:
        """Register a new model type."""
        cls._models[name] = model_class
    
    @classmethod
    def list_models(cls) -> List[str]:
        return list(cls._models.keys())


def get_landslide_model(model_type: Optional[str] = None, config=None) -> Any:
    """
    Get landslide model instance.
    
    Args:
        model_type: Model type (None = use config default)
        config: Configuration object
        
    Returns:
        Model instance
    """
    config = config or get_landslide_config()
    model_type = model_type or config.model_type
    return LandslideModelFactory.create(model_type, config)