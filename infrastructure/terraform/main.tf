terraform {
  backend "gcs" {
    bucket  = "claude-vertex-prod-tf-state"
    prefix  = "terraform/state"
  }
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
    "firebasehosting.googleapis.com", # Firebase Hosting
    "cloudresourcemanager.googleapis.com",
    "cloudbilling.googleapis.com",
    "iam.googleapis.com",
    "firebasevertexai.googleapis.com" # Required for new Vertex AI Client SDK
  ])

  service = each.key
  disable_on_destroy = false
}

# 2. BigQuery Dataset (ALREADY CREATED - Commenting out to avoid 409)
# resource "google_bigquery_dataset" "analytics" {
#   dataset_id                  = "telegram_app_analytics"
#   friendly_name               = "App Analytics"
#   description                 = "Raw events from Telegram Mini App"
#   location                    = "EU"
# }

# 3. Service Account for GitHub Actions (ALREADY CREATED)
# resource "google_service_account" "github_actions" {
#   account_id   = "github-actions-deployer"
#   display_name = "GitHub Actions Service Account"
# }

# 4. Permissions for GitHub Actions
resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:github-actions-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "bigquery_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:github-actions-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:github-actions-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "api_keys_admin" {
  project = var.project_id
  role    = "roles/serviceusage.apiKeysAdmin"
  member  = "serviceAccount:github-actions-deployer@${var.project_id}.iam.gserviceaccount.com"
}

# 5. Firebase Configuration (ALREADY CREATED)
# resource "google_firebase_project" "default" {
#   provider = google-beta
#   project  = var.project_id
#   
#   depends_on = [google_project_service.apis]
# }

# resource "google_firebase_web_app" "default" {
#   provider     = google-beta
#   project      = var.project_id
#   display_name = "Telegram AI App"
# 
#   # depends_on = [google_firebase_project.default]
# }

# ... existing code ...

# 6. Cloud Function APIs
resource "google_project_service" "extra_apis" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudscheduler.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# 7. Function Source Bucket
resource "google_storage_bucket" "function_bucket" {
  name     = "${var.project_id}-function-source"
  location = var.region
}

# 8. Zip Source Code (DEPRECATED - Moved to CI/CD)
# data "archive_file" "function_zip" {
#   type        = "zip"
#   source_dir  = "../../functions/generate-banner"
#   output_path = "../../dist/function-source.zip"
# }

# 9. Upload Source Code (DEPRECATED)
# resource "google_storage_bucket_object" "function_source" {
#   name   = "source-${data.archive_file.function_zip.output_md5}.zip"
#   bucket = google_storage_bucket.function_bucket.name
#   source = data.archive_file.function_zip.output_path
# }

# 10. Service Account for Function
resource "google_service_account" "banner_sa" {
  account_id   = "banner-generator-sa"
  display_name = "Banner Generator Service Account"
}

# Grant permissions to Function SA
resource "google_project_iam_member" "sa_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.banner_sa.email}"
}

resource "google_project_iam_member" "sa_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.banner_sa.email}"
}

# 11. Cloud Function (DEPRECATED - Managed by GitHub Actions)
# resource "google_cloudfunctions2_function" "generate_banner" {
# ... matches deploy.yml now ...
# }

# 12. Cloud Scheduler (DEPRECATED - Managed by GitHub Actions)
# resource "google_cloud_scheduler_job" "weekly_banner" {
# ...
# }

# Allow Scheduler (token creator) to invoke the function (Managed manually or via gcloud)
# resource "google_cloud_run_service_iam_member" "invoker" {
# ...
# }

