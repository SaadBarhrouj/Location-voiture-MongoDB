# app/extensions.py
from flask_pymongo import PyMongo
from flask_cors import CORS

# Créer des instances vides des extensions
# Elles seront liées à l'application Flask plus tard dans create_app()
mongo = PyMongo()
cors = CORS()