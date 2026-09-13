"""
Resource Optimization API Endpoint (DEMO)
=================================================================
POST /api/optimize-resources — rank incidents + recommend allocation
using the rule-based demo optimizer. Always flagged is_demo=True.
"""
import logging
from fastapi import APIRouter

from app.optimization import OptimizeRequest, OptimizeResponse, RULESET_VERSION
from app.optimization.optimizer import optimize

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Resource Optimization"])


@router.post(
    "/optimize-resources",
    response_model=OptimizeResponse,
    summary="Rank incidents and recommend demo resource allocation",
    description="DEMO endpoint: rule-based priority scoring + greedy allocation. Not for real dispatch.",
)
async def optimize_resources(request: OptimizeRequest) -> OptimizeResponse:
    logger.info(
        "Optimizing %d incidents against %d resource pools (demo=%s)",
        len(request.incidents),
        len(request.resources),
        RULESET_VERSION,
    )
    result = optimize(request.incidents, request.resources)
    return OptimizeResponse(
        success=True,
        ranked=result["ranked"],
        warnings=result["warnings"],
        error=None,
        processing_time_ms=result["processing_time_ms"],
        provider=RULESET_VERSION,
        is_demo=True,
        resource_usage=result["resource_usage"],
    )
