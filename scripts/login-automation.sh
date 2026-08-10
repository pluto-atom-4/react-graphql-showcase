#!/bin/bash

################################################################################
# Login Automation Script
#
# Automates the full login flow: services restart, database setup, user creation,
# and GraphQL login mutation testing.
#
# Usage:
#   ./scripts/login-automation.sh [<USERNAME> <PASSWORD>]
#
# Examples:
#   ./scripts/login-automation.sh testuser@example.com "SecurePass123!"
#   ./scripts/login-automation.sh                      # Interactive mode
#
# Environment Variables:
#   DEBUG=1         Enable debug logging
#   TIMEOUT=120     Service startup timeout in seconds (default: 60)
#   GRAPHQL_URL     Override GraphQL endpoint (default: http://localhost:4000/graphql)
#   DB_URL          Override database URL
#
# Exit Codes:
#   0 = Success
#   1 = Argument validation failed
#   2 = Service startup failed
#   3 = Database migration/seed failed
#   4 = User creation failed
#   5 = Login test failed
#   6 = Database connection failed
#
################################################################################

set -o pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly GRAPHQL_URL="${GRAPHQL_URL:-http://localhost:4000/graphql}"
readonly GRAPHQL_HEALTH_URL="http://localhost:4000/graphql"
readonly EXPRESS_HEALTH_URL="http://localhost:5000/health"
readonly STARTUP_TIMEOUT="${TIMEOUT:-60}"
readonly SERVICE_CHECK_INTERVAL=2

# Database configuration
readonly DATABASE_URL="${DB_URL:-postgresql://root:password@localhost:5432/boltline}"
readonly DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
readonly DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
readonly DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
readonly DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
readonly DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Logging functions
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $*"
}

log_error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗ ERROR:${NC} $*" >&2
}

log_warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $*"
}

log_info() {
  echo -e "${CYAN}[INFO]${NC} $*"
}

debug() {
  if [[ "${DEBUG:-}" == "1" ]]; then
    echo -e "${BLUE}[DEBUG]${NC} $*" >&2
  fi
}

# Cleanup function
cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    log_warning "Script exited with code $exit_code"
  fi
  return $exit_code
}

trap cleanup EXIT

################################################################################
# MENU FUNCTIONS
################################################################################

show_main_menu() {
  echo ""
  echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${MAGENTA}                    LOGIN AUTOMATION MENU${NC}"
  echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Select an option:"
  echo "  1. Run full automation (all steps)"
  echo "  2. Validate environment & dependencies"
  echo "  3. Check PostgreSQL database tables"
  echo "  4. Restart services only"
  echo "  5. Run database migrations only"
  echo "  6. Run database seed only"
  echo "  7. Create test user"
  echo "  8. Test login (requires existing user)"
  echo "  9. View database schema"
  echo " 10. Custom flow (select multiple steps)"
  echo "  0. Exit"
  echo ""
}

show_custom_flow_menu() {
  echo ""
  echo -e "${CYAN}Select steps to run (in order):${NC}"
  echo ""
  echo "  1. Kill existing services"
  echo "  2. Start services"
  echo "  3. Run migrations"
  echo "  4. Run seed"
  echo "  5. Create test user"
  echo "  6. Test login"
  echo "  7. Display token"
  echo ""
  echo "  0. Back to main menu"
  echo ""
}

get_user_credentials() {
  local username="$1"
  local password="$2"

  # If provided as arguments, use them
  if [[ -n "$username" && -n "$password" ]]; then
    echo "$username" "$password"
    return 0
  fi

  # Otherwise prompt for input
  echo ""
  read -rp "Enter username (email): " username
  if [[ -z "$username" ]]; then
    log_error "Username cannot be empty"
    return 1
  fi

  read -rsp "Enter password: " password
  echo ""
  if [[ -z "$password" ]]; then
    log_error "Password cannot be empty"
    return 1
  fi

  read -rsp "Confirm password: " password_confirm
  echo ""
  if [[ "$password" != "$password_confirm" ]]; then
    log_error "Passwords do not match"
    return 1
  fi

  echo "$username" "$password"
  return 0
}

################################################################################
# VALIDATION FUNCTIONS
################################################################################

validate_arguments() {
  if [[ $# -lt 2 ]]; then
    return 0  # No arguments provided, will use interactive mode
  fi

  local username="$1"
  local password="$2"

  # Validate username is not empty and looks like an email
  if [[ -z "$username" ]]; then
    log_error "Username cannot be empty"
    return 1
  fi

  if [[ ! "$username" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    log_warning "Username doesn't look like a valid email address: $username"
  fi

  # Validate password is not empty
  if [[ -z "$password" ]]; then
    log_error "Password cannot be empty"
    return 1
  fi

  if [[ ${#password} -lt 6 ]]; then
    log_warning "Password is very short (${#password} characters)"
  fi

  log_success "Arguments validated"
  debug "Username: $username"
  debug "Password: $(echo "$password" | sed 's/./*/g')"

  return 0
}

check_dependencies() {
  log "Checking dependencies..."
  local missing_deps=()

  # Check required commands (tsx is in node_modules, so skip it here)
  local required_commands=("pnpm" "curl" "jq" "node")

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &>/dev/null; then
      missing_deps+=("$cmd")
    else
      debug "  ✓ $cmd found"
    fi
  done

  # Check optional PostgreSQL tools
  if ! command -v psql &>/dev/null; then
    log_warning "psql not found - PostgreSQL client tools won't be available"
  else
    debug "  ✓ psql found"
  fi

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    log_error "Missing required dependencies: ${missing_deps[*]}"
    echo "Please install the missing commands and try again." >&2
    return 1
  fi

  log_success "All required dependencies found"
  return 0
}

check_db_connection() {
  log "Checking PostgreSQL connection..."
  log_info "Database: $DB_NAME @ $DB_HOST:$DB_PORT"

  if ! command -v psql &>/dev/null; then
    log_warning "psql not installed - skipping database connection test"
    return 0
  fi

  # Attempt connection with timeout
  if PGPASSWORD="$DB_PASS" timeout 5 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    log_success "Database connection successful"
    return 0
  else
    log_error "Failed to connect to database"
    log_warning "Make sure PostgreSQL is running: docker-compose up -d"
    return 6
  fi
}

list_db_tables() {
  log "Listing PostgreSQL tables..."

  if ! command -v psql &>/dev/null; then
    log_error "psql not installed - cannot list tables"
    return 1
  fi

  local query="\dt"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query" 2>/dev/null

  return 0
}

show_table_details() {
  local table="$1"

  if ! command -v psql &>/dev/null; then
    log_error "psql not installed"
    return 1
  fi

  log "Table: $table"
  log "Schema:"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d $table" 2>/dev/null

  log "Row count:"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs -I {} echo "  {} rows"
}

show_db_schema() {
  log "Display PostgreSQL Database Schema"
  echo ""

  if ! command -v psql &>/dev/null; then
    log_error "psql not installed - cannot display schema"
    return 1
  fi

  # Check connection first
  if ! check_db_connection; then
    return 1
  fi

  echo ""
  echo "Available tables:"
  list_db_tables
  echo ""

  # Show schema for each table
  for table in "\"user\"" "build" "part" "testrun"; do
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null | grep -q 1; then
      echo ""
      show_table_details "$table"
    fi
  done
}

view_db_records() {
  log "View database records"
  echo ""

  if ! command -v psql &>/dev/null; then
    log_error "psql not installed"
    return 1
  fi

  # Show users
  echo -e "${CYAN}Users:${NC}"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT id, email, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 10;" 2>/dev/null || echo "No users found"

  echo ""
  echo -e "${CYAN}Builds:${NC}"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT id, name, status, created_at FROM build ORDER BY created_at DESC LIMIT 10;" 2>/dev/null || echo "No builds found"

  echo ""
  echo -e "${CYAN}Parts:${NC}"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT id, name, sku, quantity FROM part LIMIT 10;" 2>/dev/null || echo "No parts found"
}

################################################################################
# SERVICE MANAGEMENT FUNCTIONS
################################################################################

kill_existing_services() {
  log "Stopping existing services..."

  # Kill pnpm dev processes
  if pgrep -f "pnpm.*dev" >/dev/null; then
    log_warning "Found existing pnpm dev processes, killing them..."
    pkill -f "pnpm.*dev" || true
    sleep 2
  else
    debug "No existing pnpm dev processes found"
  fi

  # Kill specific service processes if still running
  for port in 3000 4000 5000; do
    if lsof -i ":$port" >/dev/null 2>&1; then
      log_warning "Port $port is in use, attempting to free it..."
      lsof -i ":$port" | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
      sleep 1
    fi
  done

  log_success "Service cleanup complete"
}

start_services() {
  log "Starting services with 'pnpm dev'..."

  cd "$PROJECT_ROOT" || return 1

  # Start services in background
  if pnpm dev >/tmp/pnpm-dev.log 2>&1 &
  then
    local pnpm_pid=$!
    debug "Started pnpm dev with PID $pnpm_pid"
    echo $pnpm_pid >/tmp/pnpm-dev.pid

    log "Waiting for services to be ready (timeout: ${STARTUP_TIMEOUT}s)..."
    sleep 3  # Initial delay

    local start_time=$(date +%s)
    local graphql_ready=0
    local express_ready=0

    while [[ $(($(date +%s) - start_time)) -lt $STARTUP_TIMEOUT ]]; do
      # Check GraphQL health
      if [[ $graphql_ready -eq 0 ]] && curl -s "$GRAPHQL_HEALTH_URL" >/dev/null 2>&1; then
        log_success "GraphQL server is ready"
        graphql_ready=1
      fi

      # Check Express health
      if [[ $express_ready -eq 0 ]] && timeout 2 bash -c "echo > /dev/tcp/localhost/5000" 2>/dev/null; then
        log_success "Express server is ready"
        express_ready=1
      fi

      # Break if both are ready
      if [[ $graphql_ready -eq 1 ]] && [[ $express_ready -eq 1 ]]; then
        log_success "All services are ready"
        return 0
      fi

      debug "Waiting for services... (${graphql_ready}/1 GraphQL, ${express_ready}/1 Express)"
      sleep $SERVICE_CHECK_INTERVAL
    done

    log_error "Services failed to start within ${STARTUP_TIMEOUT}s"
    log "See /tmp/pnpm-dev.log for details"
    tail -n 30 /tmp/pnpm-dev.log >&2
    return 2
  else
    log_error "Failed to start pnpm dev"
    return 2
  fi
}

################################################################################
# DATABASE FUNCTIONS
################################################################################

run_migrations() {
  log "Running database migrations..."

  cd "$PROJECT_ROOT" || return 1

  if pnpm -F backend-graphql db:migrate 2>&1 | tee /tmp/migration.log; then
    log_success "Database migrations completed"
    return 0
  else
    log_error "Database migrations failed"
    tail -n 20 /tmp/migration.log >&2
    return 3
  fi
}

run_seed() {
  log "Running database seed..."

  cd "$PROJECT_ROOT" || return 1

  if pnpm -F backend-graphql db:seed 2>&1 | tee /tmp/seed.log; then
    log_success "Database seed completed"
    return 0
  else
    log_error "Database seed failed"
    tail -n 20 /tmp/seed.log >&2
    return 3
  fi
}

create_test_user() {
  local username="$1"
  local password="$2"

  log "Creating test user: $username"

  # Create a temporary seed script
  local seed_script="/tmp/seed-test-user-$$.ts"
  cat >"$seed_script" <<'SEED_EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  console.log(`[Seed] Creating test user: ${testEmail}`);

  const hashedPassword = await bcrypt.hash(testPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: { passwordHash: hashedPassword },
    create: { email: testEmail, passwordHash: hashedPassword },
  });

  console.log(`[Seed] Success: User ID ${user.id}`);
}

main()
  .catch((e) => {
    console.error(`[Seed] Error: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED_EOF

  cd "$PROJECT_ROOT" || return 1

  # Run seed with environment variables
  if TEST_USER_EMAIL="$username" TEST_USER_PASSWORD="$password" \
    pnpm -F backend-graphql exec tsx "$seed_script" 2>&1 | tee /tmp/create-user.log; then
    log_success "Test user created: $username"
    rm -f "$seed_script"
    return 0
  else
    log_error "Failed to create test user"
    tail -n 20 /tmp/create-user.log >&2
    rm -f "$seed_script"
    return 4
  fi
}

################################################################################
# GRAPHQL TESTING FUNCTIONS
################################################################################

test_login() {
  local username="$1"
  local password="$2"

  log "Testing login via GraphQL mutation..."
  debug "GraphQL URL: $GRAPHQL_URL"
  debug "Username: $username"

  # Prepare the GraphQL mutation
  local mutation=$(cat <<MUTATION_EOF
{
  "query": "mutation Login(\$email: String!, \$password: String!) { login(email: \$email, password: \$password) { token user { id email } } }",
  "variables": {
    "email": "$username",
    "password": "$password"
  }
}
MUTATION_EOF
  )

  debug "Sending mutation to $GRAPHQL_URL"

  # Send the mutation and capture response
  local response
  response=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d "$mutation" 2>/tmp/curl-error.log)

  # Check for curl errors
  if [[ -s /tmp/curl-error.log ]]; then
    log_error "Network error during login test:"
    cat /tmp/curl-error.log >&2
    return 5
  fi

  debug "Response: $response"

  # Check for GraphQL errors
  if echo "$response" | jq -e '.errors' >/dev/null 2>&1; then
    local error_msg=$(echo "$response" | jq -r '.errors[0].message' 2>/dev/null || echo "Unknown error")
    log_error "GraphQL error: $error_msg"
    debug "Full response: $response"
    return 5
  fi

  # Extract token and user info
  local token
  token=$(echo "$response" | jq -r '.data.login.token' 2>/dev/null)

  local user_id
  user_id=$(echo "$response" | jq -r '.data.login.user.id' 2>/dev/null)

  local user_email
  user_email=$(echo "$response" | jq -r '.data.login.user.email' 2>/dev/null)

  if [[ -z "$token" ]] || [[ "$token" == "null" ]]; then
    log_error "No token received in login response"
    debug "Full response: $response"
    return 5
  fi

  log_success "Login successful!"
  log_success "User ID: $user_id"
  log_success "User Email: $user_email"

  return 0
}

display_token() {
  local username="$1"
  local password="$2"

  log "Retrieving JWT token..."

  local mutation=$(cat <<MUTATION_EOF
{
  "query": "mutation Login(\$email: String!, \$password: String!) { login(email: \$email, password: \$password) { token user { id email } } }",
  "variables": {
    "email": "$username",
    "password": "$password"
  }
}
MUTATION_EOF
  )

  local response
  response=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d "$mutation")

  if echo "$response" | jq -e '.data.login.token' >/dev/null 2>&1; then
    local token
    token=$(echo "$response" | jq -r '.data.login.token')

    local user_id
    user_id=$(echo "$response" | jq -r '.data.login.user.id')

    echo ""
    echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}                    LOGIN AUTHENTICATION TOKEN                   ${NC}"
    echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Username:  $username"
    echo "User ID:   $user_id"
    echo ""
    echo "JWT Token:"
    echo "$token"
    echo ""
    echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Token Details:"
    echo "  - Valid for: 24 hours"
    echo "  - Usage: Add 'Authorization: Bearer <token>' to GraphQL requests"
    echo ""
    echo "Example curl command:"
    echo ""
    echo "  curl -X POST $GRAPHQL_URL \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -H 'Authorization: Bearer $token' \\"
    echo "    -d '{\"query\": \"{ builds(limit: 10, offset: 0) { items { id name } } }\" }'"
    echo ""

    return 0
  else
    log_error "Failed to retrieve token"
    return 5
  fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
  log "════════════════════════════════════════════════════════════════"
  log "                  LOGIN AUTOMATION SCRIPT                        "
  log "════════════════════════════════════════════════════════════════"
  echo ""

  # Parse initial arguments
  local username=""
  local password=""
  local auto_run=false

  if [[ $# -ge 2 ]]; then
    username="$1"
    password="$2"
    validate_arguments "$@" || return 1
    auto_run=true
  fi

  # If arguments provided, skip menu and run full automation
  if [[ "$auto_run" == "true" ]]; then
    echo ""
    check_dependencies || return 1
    echo ""

    kill_existing_services
    echo ""
    start_services || return 2
    echo ""
    run_migrations || return 3
    echo ""
    run_seed || return 3
    echo ""
    create_test_user "$username" "$password" || return 4
    echo ""
    test_login "$username" "$password" || return 5
    echo ""
    display_token "$username" "$password" || return 5
    echo ""
    log_success "════════════════════════════════════════════════════════════════"
    log_success "                  ALL STEPS COMPLETED SUCCESSFULLY!               "
    log_success "════════════════════════════════════════════════════════════════"
    return 0
  fi

  # Main menu loop (only when no arguments)
  while true; do
    show_main_menu
    read -rp "Enter your choice (0-10): " choice

    case "$choice" in
    1)
      # Full automation
      echo ""
      check_dependencies || return 1
      echo ""

      # Get credentials if not already provided
      if [[ -z "$username" ]]; then
        credentials=$(get_user_credentials "$username" "$password") || continue
        read -r username password <<<"$credentials"
      fi

      kill_existing_services
      echo ""
      start_services || return 2
      echo ""
      run_migrations || return 3
      echo ""
      run_seed || return 3
      echo ""
      create_test_user "$username" "$password" || return 4
      echo ""
      test_login "$username" "$password" || return 5
      echo ""
      display_token "$username" "$password" || return 5
      echo ""
      log_success "════════════════════════════════════════════════════════════════"
      log_success "                  ALL STEPS COMPLETED SUCCESSFULLY!               "
      log_success "════════════════════════════════════════════════════════════════"
      ;;

    2)
      # Validate environment
      echo ""
      check_dependencies || return 1
      echo ""
      check_db_connection || true
      read -rp "Press Enter to continue..."
      ;;

    3)
      # Check database tables
      echo ""
      check_db_connection || return 6
      echo ""
      list_db_tables
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    4)
      # Restart services only
      echo ""
      kill_existing_services
      echo ""
      start_services || return 2
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    5)
      # Run migrations only
      echo ""
      run_migrations || return 3
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    6)
      # Run seed only
      echo ""
      run_seed || return 3
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    7)
      # Create test user
      echo ""
      if [[ -z "$username" ]]; then
        credentials=$(get_user_credentials "$username" "$password") || continue
        read -r username password <<<"$credentials"
      fi
      create_test_user "$username" "$password" || return 4
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    8)
      # Test login
      echo ""
      if [[ -z "$username" ]]; then
        credentials=$(get_user_credentials "$username" "$password") || continue
        read -r username password <<<"$credentials"
      fi
      test_login "$username" "$password" || return 5
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    9)
      # View database schema
      echo ""
      show_db_schema
      echo ""
      read -rp "Press Enter to continue..."
      ;;

    10)
      # Custom flow
      echo ""
      echo "This feature allows you to run specific steps in order."
      echo "Enter step numbers separated by commas (e.g., 1,2,3)"
      echo ""
      show_custom_flow_menu
      read -rp "Enter steps to run (comma-separated): " steps_input

      if [[ "$steps_input" == "0" ]]; then
        continue
      fi

      # Parse and execute steps
      IFS=',' read -ra steps <<<"$steps_input"
      for step in "${steps[@]}"; do
        step=$(echo "$step" | xargs)  # Trim whitespace
        case "$step" in
        1)
          kill_existing_services
          echo ""
          ;;
        2)
          start_services || return 2
          echo ""
          ;;
        3)
          run_migrations || return 3
          echo ""
          ;;
        4)
          run_seed || return 3
          echo ""
          ;;
        5)
          if [[ -z "$username" ]]; then
            credentials=$(get_user_credentials "$username" "$password") || continue
            read -r username password <<<"$credentials"
          fi
          create_test_user "$username" "$password" || return 4
          echo ""
          ;;
        6)
          if [[ -z "$username" ]]; then
            credentials=$(get_user_credentials "$username" "$password") || continue
            read -r username password <<<"$credentials"
          fi
          test_login "$username" "$password" || return 5
          echo ""
          ;;
        7)
          if [[ -z "$username" ]]; then
            credentials=$(get_user_credentials "$username" "$password") || continue
            read -r username password <<<"$credentials"
          fi
          display_token "$username" "$password" || return 5
          echo ""
          ;;
        *)
          log_warning "Unknown step: $step"
          ;;
        esac
      done
      read -rp "Press Enter to continue..."
      ;;

    0)
      log_success "Exiting..."
      return 0
      ;;

    *)
      log_error "Invalid choice. Please try again."
      ;;
    esac
  done
}

# Run main function
main "$@"
exit $?
