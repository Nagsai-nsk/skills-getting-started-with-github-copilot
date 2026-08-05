import copy

from fastapi.testclient import TestClient
import pytest

from src import app as app_module

_INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    app_module.activities = copy.deepcopy(_INITIAL_ACTIVITIES)


@pytest.fixture
def client():
    return TestClient(app_module.app)
