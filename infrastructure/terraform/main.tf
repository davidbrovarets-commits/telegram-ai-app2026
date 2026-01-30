terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.51.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 4.51.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Essential Services
resource "google_project_service" "apis" {
  for_each = toset([
    "aiplatform.googleapis.com",      # Vertex AI (Imagen, Gemini)
    "analytics.googleapis.com",       # Google Analytics
    "logging.googleapis.com",         # Cloud Logging
    "monitoring.googleapis.com",      # Cloud Monitoring
    "bigquery.googleapis.com",        # BigQuery (Data Warehouse)
    "cloudbuild.googleapis.com",      # CI/CD
    "firebase.googleapis.com",        # Firebase Core
    "serviceusage.googleapis.com",    # Service Usage
    "firebasehosting.googleapis.com"  # Firebase Hosting
  ])

  service = each.key
  disable_on_destroy = false
}

# 2. BigQuery Dataset for App Analytics
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "telegram_app_analytics"
  friendly_name               = "App Analytics"
  description                 = "Raw events from Telegram Mini App"
  location                    = "EU"
}

# 3. Service Account for GitHub Actions
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Service Account"
}

# 4. Permissions for GitHub Actions
resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "bigquery_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "api_keys_admin" {
  project = var.project_id
  role    = "roles/serviceusage.apiKeysAdmin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# 5. Firebase Configuration
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
  
  depends_on = [google_project_service.apis]
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "Telegram AI App"

  depends_on = [google_firebase_project.default]
}

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.project_id # Default site often matches project ID

  depends_on = [google_firebase_project.default]
}
