from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_bcrypt import Bcrypt # Import Bcrypt

mongo = PyMongo()
cors = CORS()
bcrypt = Bcrypt()