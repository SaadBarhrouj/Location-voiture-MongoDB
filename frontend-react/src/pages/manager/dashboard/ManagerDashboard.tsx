import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faUser,
  faCalendarCheck,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function ManagerDashboard() {
  return (
    // Remplacez la div existante par ce contenu
    <div className="p-6 space-y-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Manager Dashboard
      </h1>
      <p className="text-xs text-muted-foreground">
        Bienvenue sur le tableau de bord manager. Gérez les voitures, clients et
        réservations ici.
      </p>

      {/* Section des cartes statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voitures</CardTitle>
            {/* Replace Car icon */}
            <FontAwesomeIcon icon={faCar} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">4 actuellement louées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            {/* Replace User icon */}
            <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">8 actifs ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Réservations en attente
            </CardTitle>
            <FontAwesomeIcon icon={faCalendarCheck} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">En attente d'approbation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations Actives</CardTitle>
            {/* Replace CheckCircle icon */}
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Voitures actuellement louées</p>
          </CardContent>
        </Card>
      </div>

      {/* Section des réservations récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Réservations Récentes</CardTitle>
          <CardDescription className="text-xs">Dernières demandes de réservation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exemple de réservation 1 */}
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="text-xs font-medium">Toyota Yaris</p>
                <p className="text-xs text-muted-foreground">
                  Fatima El Yousfi • 10-15 Mai, 2025
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                  En attente
                </span>
              </div>
            </div>
            {/* Exemple de réservation 2 */}
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="text-xs font-medium">Renault Clio</p>
                <p className="text-xs text-muted-foreground">
                  Karim Alaoui • 8-12 Mai, 2025
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Acceptée
                </span>
              </div>
            </div>
            {/* Exemple de réservation 3 */}
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="text-xs font-medium">Dacia Logan</p>
                <p className="text-xs text-muted-foreground">
                  Omar Benjelloun • 5-7 Mai, 2025
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  Refusée
                </span>
              </div>
            </div>
            {/* Ajoutez d'autres réservations si nécessaire */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}