from .base import *
import os

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = False
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {'format': '{levelname} {asctime} {module} {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'},
    },
    'root':   {'handlers': ['console'], 'level': 'DEBUG'},
    'loggers': {
        'django':                       {'handlers': ['console'], 'level': 'INFO',  'propagate': False},
        'management.sync_permissions':  {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'roles':                        {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'authentication':               {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
    },
}
# Passwords de prueba permitidas (solo desarrollo)
AUTH_PASSWORD_VALIDATORS = []



