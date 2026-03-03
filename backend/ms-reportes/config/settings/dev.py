from .base import *

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = False
AUTH_PASSWORD_VALIDATORS = []

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {'format': '{levelname} {asctime} {module} {message}', 'style': '{'},
    },
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'}},
    'root':    {'handlers': ['console'], 'level': 'DEBUG'},
    'loggers': {
        'django':   {'handlers': ['console'], 'level': 'INFO',  'propagate': False},
        'reportes': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
    },
}