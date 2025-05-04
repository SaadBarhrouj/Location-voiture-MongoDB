# run.py
# Ce fichier est le point d'entrée principal pour lancer l'application.

# Importer la fonction 'create_app' (notre Application Factory)
# depuis le package 'app' (qui correspond au dossier app/ et son fichier __init__.py)
from app import create_app

# Appeler la fonction factory pour obtenir une instance configurée
# de notre application Flask. C'est ici que la configuration,
# les extensions et les blueprints sont mis en place.
app = create_app()

# Bloc standard en Python : ce code ne s'exécute que si
# ce fichier 'run.py' est lancé directement (ex: 'python run.py')
# et non pas s'il est importé par un autre module.
if __name__ == '__main__':
    # Lancer le serveur de développement intégré de Flask.
    # Idéal pour le développement local, mais PAS pour la production.
    # host='0.0.0.0' : Rend le serveur accessible depuis d'autres machines
    #                 sur le même réseau (pas juste depuis localhost/127.0.0.1).
    #                 Utile pour tester depuis un mobile, par exemple.
    # port=5000 :    Port sur lequel le serveur écoute (valeur par défaut).
    # debug=True/False: Le mode debug est automatiquement géré par la variable
    #                   d'environnement FLASK_DEBUG (lue depuis .env/.flaskenv),
    #                   il n'est donc pas nécessaire de le spécifier ici.
    app.run(host='0.0.0.0', port=5000)