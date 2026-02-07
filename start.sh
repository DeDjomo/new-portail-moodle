#!/bin/bash

# =============================================================================
# 🎓 Portail de Formation ENSPY - Script de Démarrage
# =============================================================================
# Ce script vérifie l'environnement, installe les dépendances manquantes
# et lance les serveurs de développement.
# =============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ports personnalisés (évite les ports communs)
BACKEND_PORT=9080
FRONTEND_PORT=9090

# Répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# =============================================================================
# Fonctions utilitaires
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Vérification du système d'exploitation
# =============================================================================

print_header "Vérification du système"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    print_success "Système détecté: Linux"
    
    # Détecter le gestionnaire de paquets
    if check_command apt-get; then
        PKG_MANAGER="apt"
        PKG_UPDATE="sudo apt-get update"
        PKG_INSTALL="sudo apt-get install -y"
    elif check_command dnf; then
        PKG_MANAGER="dnf"
        PKG_UPDATE="sudo dnf check-update || true"
        PKG_INSTALL="sudo dnf install -y"
    elif check_command pacman; then
        PKG_MANAGER="pacman"
        PKG_UPDATE="sudo pacman -Sy"
        PKG_INSTALL="sudo pacman -S --noconfirm"
    else
        print_error "Gestionnaire de paquets non supporté"
        exit 1
    fi
    print_success "Gestionnaire de paquets: $PKG_MANAGER"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    print_success "Système détecté: macOS"
    
    if check_command brew; then
        PKG_MANAGER="brew"
        PKG_UPDATE="brew update"
        PKG_INSTALL="brew install"
    else
        print_warning "Homebrew n'est pas installé. Installation..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        PKG_MANAGER="brew"
        PKG_UPDATE="brew update"
        PKG_INSTALL="brew install"
    fi
else
    print_error "Système d'exploitation non supporté: $OSTYPE"
    exit 1
fi

# =============================================================================
# Vérification et installation des dépendances
# =============================================================================

print_header "Vérification des dépendances"

MISSING_DEPS=()

# Vérifier PHP
if check_command php; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d ' ' -f 2 | cut -d '.' -f 1,2)
    print_success "PHP installé: version $PHP_VERSION"
else
    print_warning "PHP non trouvé"
    MISSING_DEPS+=("php")
fi

# Vérifier MySQL
if check_command mysql; then
    MYSQL_VERSION=$(mysql --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    print_success "MySQL installé: version $MYSQL_VERSION"
else
    print_warning "MySQL non trouvé"
    MISSING_DEPS+=("mysql")
fi

# Vérifier Git
if check_command git; then
    GIT_VERSION=$(git --version | cut -d ' ' -f 3)
    print_success "Git installé: version $GIT_VERSION"
else
    print_warning "Git non trouvé"
    MISSING_DEPS+=("git")
fi

# =============================================================================
# Installation des dépendances manquantes
# =============================================================================

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_header "Installation des dépendances manquantes"
    
    echo -e "${YELLOW}Les dépendances suivantes seront installées:${NC}"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    
    echo ""
    read -p "Voulez-vous continuer? (o/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        print_info "Mise à jour des paquets..."
        eval $PKG_UPDATE
        
        for dep in "${MISSING_DEPS[@]}"; do
            print_info "Installation de $dep..."
            
            case $dep in
                "php")
                    if [ "$PKG_MANAGER" == "apt" ]; then
                        eval "$PKG_INSTALL php php-mysql php-mbstring php-json php-fileinfo php-curl"
                    elif [ "$PKG_MANAGER" == "dnf" ]; then
                        eval "$PKG_INSTALL php php-mysqlnd php-mbstring php-json php-fileinfo"
                    elif [ "$PKG_MANAGER" == "pacman" ]; then
                        eval "$PKG_INSTALL php"
                    elif [ "$PKG_MANAGER" == "brew" ]; then
                        eval "$PKG_INSTALL php"
                    fi
                    ;;
                "mysql")
                    if [ "$PKG_MANAGER" == "apt" ]; then
                        eval "$PKG_INSTALL mysql-server mysql-client"
                    elif [ "$PKG_MANAGER" == "dnf" ]; then
                        eval "$PKG_INSTALL mysql-server"
                    elif [ "$PKG_MANAGER" == "pacman" ]; then
                        eval "$PKG_INSTALL mariadb"
                    elif [ "$PKG_MANAGER" == "brew" ]; then
                        eval "$PKG_INSTALL mysql"
                    fi
                    ;;
                "git")
                    eval "$PKG_INSTALL git"
                    ;;
            esac
            
            print_success "$dep installé"
        done
    else
        print_error "Installation annulée. Veuillez installer les dépendances manuellement."
        exit 1
    fi
fi

# =============================================================================
# Vérification des extensions PHP
# =============================================================================

print_header "Vérification des extensions PHP"

REQUIRED_EXTENSIONS=("pdo_mysql" "mbstring" "json" "fileinfo")

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if php -m | grep -qi "$ext"; then
        print_success "Extension $ext: OK"
    else
        print_warning "Extension $ext manquante"
        
        if [ "$PKG_MANAGER" == "apt" ]; then
            print_info "Tentative d'installation de php-$ext..."
            eval "$PKG_INSTALL php-$ext" || print_warning "Impossible d'installer $ext automatiquement"
        fi
    fi
done

# =============================================================================
# Vérification de la structure du projet
# =============================================================================

print_header "Vérification de la structure du projet"

if [ ! -d "$SCRIPT_DIR/backend" ]; then
    print_error "Dossier 'backend' non trouvé"
    exit 1
fi
print_success "Dossier backend: OK"

if [ ! -d "$SCRIPT_DIR/frontend" ]; then
    print_error "Dossier 'frontend' non trouvé"
    exit 1
fi
print_success "Dossier frontend: OK"

if [ ! -f "$SCRIPT_DIR/backend/public/index.php" ]; then
    print_error "Point d'entrée backend (index.php) non trouvé"
    exit 1
fi
print_success "Point d'entrée backend: OK"

# Créer les dossiers uploads si nécessaires
mkdir -p "$SCRIPT_DIR/backend/public/uploads/avatars"
mkdir -p "$SCRIPT_DIR/backend/public/uploads/courses"
chmod -R 755 "$SCRIPT_DIR/backend/public/uploads" 2>/dev/null || true
print_success "Dossiers uploads: OK"

# =============================================================================
# Vérification de la base de données
# =============================================================================

print_header "Vérification de la base de données"

# Tester la connexion MySQL
if check_command mysql; then
    print_info "Tentative de connexion à MySQL..."
    
    if mysql -u root -e "SELECT 1" &>/dev/null; then
        print_success "Connexion MySQL (sans mot de passe): OK"
        
        # Vérifier si la base existe
        if mysql -u root -e "USE portal" &>/dev/null; then
            print_success "Base de données 'portal': OK"
        else
            print_warning "Base de données 'portal' non trouvée"
            echo ""
            read -p "Voulez-vous créer la base de données? (o/N) " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Oo]$ ]]; then
                print_info "Création de la base de données..."
                mysql -u root -e "CREATE DATABASE IF NOT EXISTS portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                
                if [ -f "$SCRIPT_DIR/backend/sql/schema.sql" ]; then
                    print_info "Import du schéma..."
                    mysql -u root portal < "$SCRIPT_DIR/backend/sql/schema.sql"
                fi
                
                if [ -f "$SCRIPT_DIR/backend/sql/seed_database.sql" ]; then
                    print_info "Import des données de test..."
                    mysql -u root portal < "$SCRIPT_DIR/backend/sql/seed_database.sql"
                fi
                
                print_success "Base de données créée et initialisée"
            fi
        fi
    else
        print_warning "Connexion MySQL nécessite un mot de passe"
        print_info "Veuillez configurer la base de données manuellement"
        print_info "Voir: DEPLOY_LOCAL.md"
    fi
else
    print_warning "MySQL non accessible, veuillez configurer la BDD manuellement"
fi

# =============================================================================
# Vérification des ports
# =============================================================================

print_header "Vérification des ports"

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port occupé
    else
        return 0  # Port libre
    fi
}

# Vérifier et trouver des ports libres
while ! check_port $BACKEND_PORT; do
    print_warning "Port $BACKEND_PORT occupé, tentative du port suivant..."
    BACKEND_PORT=$((BACKEND_PORT + 1))
done
print_success "Port backend: $BACKEND_PORT (libre)"

while ! check_port $FRONTEND_PORT; do
    print_warning "Port $FRONTEND_PORT occupé, tentative du port suivant..."
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done
print_success "Port frontend: $FRONTEND_PORT (libre)"

# =============================================================================
# Lancement des serveurs
# =============================================================================

print_header "Lancement des serveurs"

# Fonction de nettoyage
cleanup() {
    echo ""
    print_info "Arrêt des serveurs..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    print_success "Serveurs arrêtés"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Lancer le backend
print_info "Démarrage du serveur backend sur le port $BACKEND_PORT..."
cd "$SCRIPT_DIR"
php -S localhost:$BACKEND_PORT -t backend/public > /tmp/portal_backend.log 2>&1 &
BACKEND_PID=$!
sleep 1

if kill -0 $BACKEND_PID 2>/dev/null; then
    print_success "Backend démarré (PID: $BACKEND_PID)"
else
    print_error "Échec du démarrage du backend"
    cat /tmp/portal_backend.log
    exit 1
fi

# Lancer le frontend
print_info "Démarrage du serveur frontend sur le port $FRONTEND_PORT..."
php -S localhost:$FRONTEND_PORT -t frontend > /tmp/portal_frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 1

if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_success "Frontend démarré (PID: $FRONTEND_PID)"
else
    print_error "Échec du démarrage du frontend"
    cat /tmp/portal_frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# =============================================================================
# Résumé et liens
# =============================================================================

print_header "🎉 Portail de Formation prêt!"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SERVEURS DÉMARRÉS                       ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  📡 Backend API:    ${CYAN}http://localhost:$BACKEND_PORT${NC}               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🖥️  Frontend:       ${CYAN}http://localhost:$FRONTEND_PORT${NC}               ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  📚 Catalogue:      ${CYAN}http://localhost:$FRONTEND_PORT/catalog.html${NC}  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🔐 Login Admin:    ${CYAN}http://localhost:$FRONTEND_PORT/login.html${NC}    ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                    COMPTES DE TEST                         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Super Admin: atangana.roger@portal.com / SuperAdmin123    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Admin:       bella.marie@portal.com / Admin123!           ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
echo ""

# Attendre
wait
