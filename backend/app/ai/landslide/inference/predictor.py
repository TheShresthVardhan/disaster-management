"""
Landslide Risk Inference Module
=================================================================
Inference pipeline for landslide risk prediction.
"""
import numpy as np
from typing import Optional, List, Dict, Any, Union
from pathlib import Path
import logging
import time
from app.ai.landslide.config import get_landslide_config
from app.ai.landslide.schemas import (
    LandslideInputFeatures,
    LandslideRiskResult,
    LandslideRiskCategory,
    SoilType,
    LandCover,
    Geology
)
from app.ai.landslide.models import (
    RandomForestLandslideModel,
    DemoLandslideModel,
    get_landslide_model
)
from app.ai.landslide.preprocessing.processor import LandslidePreprocessor

logger = logging.getLogger(__name__)


class LandslideRiskPredictor:
    """
    High-level inference interface for landslide risk prediction.
    Handles model loading, preprocessing, and prediction.
    """
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        preprocessor_path: Optional[str] = None,
        model_type: Optional[str] = None,
        config=None,
        use_demo: bool = False
    ):
        """
        Initialize the predictor.
        
        Args:
            model_path: Path to saved model file
            preprocessor_path: Path to saved preprocessor
            model_type: Model type ('random_forest', 'demo', etc.)
            config: Configuration object
            use_demo: Force use of demo provider
        """
        self.config = config or get_landslide_config()
        
        if use_demo or self.config.demo_mode:
            self.model_type = 'demo'
        else:
            self.model_type = model_type or self.config.model_type
        
        self.model = None
        self.preprocessor = None
        self.is_loaded = False
        
        # Try to load model if paths provided
        if model_path:
            self.load_model(model_path, preprocessor_path)
    
    def load_model(
        self,
        model_path: str,
        preprocessor_path: Optional[str] = None
    ) -> None:
        """
        Load trained model and optional preprocessor.
        
        Args:
            model_path: Path to model file
            preprocessor_path: Path to preprocessor file (optional)
        """
        logger.info(f"Loading model from {self.model_type}")
        
        if self.model_type == 'demo':
            self.model = DemoLandslideModel()
            self.preprocessor = None
            self.is_loaded = True
            logger.info("Loaded demo model")
            return
        
        # Load the model
        self.model = get_landslide_model(self.model_type)
        self.model = type(self.model).load(model_path)
        
        # Load preprocessor if available
        self.preprocessor = None
        if preprocessor_path:
            try:
                self.preprocessor = LandslidePreprocessor.load(preprocessor_path)
            except Exception as e:
                logger.warning(f"Could not load preprocessor: {e}")
        
        self.is_loaded = True
        logger.info(f"Model loaded successfully: {self.model.name} v{self.model.version}")
    
    def predict(
        self,
        features: Union['LandslideInputFeatures', Dict[str, Any], List['LandslideInputFeatures']],
        return_probabilities: bool = True,
        return_feature_contributions: bool = False
    ) -> Union['LandslideRiskResult', List['LandslideRiskResult']]:
        """
        Predict landslide risk for input features.
        
        Args:
            features: Single feature set, dict, or list of feature sets
            return_probabilities: Whether to return probability distribution
            return_feature_contributions: Whether to return feature contributions
            
        Returns:
            Single result or list of results
        """
        if not self.is_loaded:
            # Auto-load demo model if not loaded
            if self.model_type == 'demo':
                self.model = DemoLandslideModel()
                self.is_loaded = True
            else:
                raise RuntimeError("Model not loaded. Call load_model() first or use demo mode.")
        
        # Handle single vs batch
        is_batch = isinstance(features, list)
        feature_list = features if is_batch else [features]
        
        results = []
        for features_item in feature_list:
            result = self._predict_single(features_item)
            results.append(result)
        
        return results if is_batch else results[0]
    
    def predict_single(
        self,
        features: Union['LandslideInputFeatures', Dict[str, Any]],
        return_probabilities: bool = True,
        return_feature_contributions: bool = False
    ) -> 'LandslideRiskResult':
        """
        Predict landslide risk for a single feature set.
        
        Args:
            features: Input features
            return_probabilities: Whether to return probability distribution
            return_feature_contributions: Whether to return feature contributions
            
        Returns:
            LandslideRiskResult
        """
        return self.predict(
            features,
            return_probabilities=return_probabilities,
            return_feature_contributions=return_feature_contributions
        )
    
    def _predict_single(
        self,
        features: Union['LandslideInputFeatures', Dict[str, Any]]
    ) -> 'LandslideRiskResult':
        """Internal single prediction."""
        # Convert to LandslideInputFeatures if dict
        if isinstance(features, dict):
            from app.ai.landslide.schemas import LandslideInputFeatures
            features = LandslideInputFeatures(**features)
        
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        start_time = time.time()
        
        # Run prediction
        result = self.model.predict_with_features(features)
        result.processing_time_ms = int((time.time() - start_time) * 1000)
        
        return result
    
    def predict_batch(
        self,
        features_list: List[Union['LandslideInputFeatures', Dict[str, Any]]],
        batch_size: int = 32
    ) -> List['LandslideRiskResult']:
        """
        Predict risk for multiple feature sets.
        
        Args:
            features_list: List of feature sets
            batch_size: Batch size for processing
            
        Returns:
            List of LandslideRiskResult
        """
        results = []
        for i in range(0, len(features_list), batch_size):
            batch = features_list[i:i+batch_size]
            batch_results = []
            for features in batch:
                result = self._predict_single(features)
                batch_results.append(result)
            results.extend(batch_results)
        return results
    
    def is_ready(self) -> bool:
        """Check if predictor is ready for inference."""
        if self.model_type == 'demo':
            return True
        return self.is_loaded and self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata."""
        if not self.is_loaded:
            return {
                'loaded': False,
                'model_type': self.model_type,
                'is_demo': self.model_type == 'demo'
            }
        
        return {
            'loaded': True,
            'model_type': self.model_type,
            'model_name': self.model.name,
            'model_version': self.model.version,
            'is_demo': self.model.is_demo,
            'is_trained': getattr(self.model, 'is_trained', False),
            'n_features': len(getattr(self.model, 'feature_names', [])),
            'classes': list(getattr(self.model, 'classes_', [])),
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Health check for the predictor."""
        return {
            'status': 'ok' if self.is_ready() else 'not_ready',
            'model_type': self.model_type,
            'is_demo': self.model_type == 'demo',
            'loaded': self.is_loaded,
        }


class LandslideRiskBatchProcessor:
    """
    Batch processing for large-scale landslide risk assessment.
    """
    
    def __init__(self, predictor: LandslideRiskPredictor):
        self.predictor = predictor
    
    def process_locations(
        self,
        locations: List[Dict[str, Any]],
        batch_size: int = 100,
        progress_callback: Optional[callable] = None
    ) -> List[Dict[str, Any]]:
        """
        Process multiple locations for landslide risk.
        
        Args:
            locations: List of location dicts with feature data
            batch_size: Batch size for processing
            progress_callback: Optional callback(progress, total)
            
        Returns:
            List of results with location info and risk assessment
        """
        results = []
        total = len(locations)
        
        for i in range(0, len(locations), self.batch_size):
            batch = locations[i:i+batch_size]
            batch_results = []
            
            for loc in batch:
                try:
                    # Convert location dict to features
                    from app.ai.landslide.schemas import LandslideInputFeatures
                    features = LandslideInputFeatures(**loc)
                    
                    result = self.predictor.predict_single(features)
                    
                    batch_results.append({
                        'location_id': loc.get('location_id', f'loc_{i}'),
                        'latitude': loc.get('latitude'),
                        'longitude': loc.get('longitude'),
                        'location_name': loc.get('location_name'),
                        'risk_category': result.risk_category.value,
                        'risk_score': result.risk_score,
                        'confidence': result.confidence,
                        'risk_factors': result.risk_factors,
                        'recommended_actions': result.recommended_actions,
                        'is_demo': result.is_demo,
                    })
                except Exception as e:
                    logger.error(f"Error processing location {loc}: {e}")
                    batch_results.append({
                        'location_id': loc.get('location_id', 'unknown'),
                        'error': str(e),
                        'risk_category': 'error',
                    })
            
            results.extend(batch_results)
            
            if progress_callback:
                progress_callback(min(i+batch_size, total), total)
        
        return results


async def async_predict_risk(
    predictor: LandslideRiskPredictor,
    features: 'LandslideInputFeatures'
) -> 'LandslideRiskResult':
    """
    Async wrapper for risk prediction.
    
    Args:
        predictor: LandslideRiskPredictor instance
        features: Input features
        
    Returns:
        LandslideRiskResult
    """
    # Run in thread pool to avoid blocking event loop
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, predictor.predict_single, features)


async def async_batch_predict_risk(
    predictor: LandslideRiskPredictor,
    features_list: List[Union['LandslideInputFeatures', Dict[str, Any]]],
    batch_size: int = 32
) -> List['LandslideRiskResult']:
    """
    Async batch prediction.
    
    Args:
        predictor: LandslideRiskPredictor instance
        features_list: List of feature sets
        batch_size: Batch size
        
    Returns:
        List of results
    """
    import asyncio
    
    results = []
    for i in range(0, len(features_list), batch_size):
        batch = features_list[i:i+batch_size]
        batch_tasks = [
            async_predict_risk(predictor, f) for f in batch
        ]
        batch_results = await asyncio.gather(*batch_tasks)
        results.extend(batch_results)
    
    return results


def create_predictor(
    model_type: Optional[str] = None,
    model_path: Optional[str] = None,
    preprocessor_path: Optional[str] = None,
    use_demo: bool = False
) -> LandslideRiskPredictor:
    """
    Factory function to create a landslide risk predictor.
    
    Args:
        model_type: Model type ('random_forest', 'demo', etc.)
        model_path: Path to model file
        preprocessor_path: Path to preprocessor file
        use_demo: Force demo mode
        
    Returns:
        Configured LandslideRiskPredictor
    """
    predictor = LandslideRiskPredictor(
        model_path=model_path,
        preprocessor_path=preprocessor_path,
        model_type=model_type,
        use_demo=use_demo
    )
    return predictor