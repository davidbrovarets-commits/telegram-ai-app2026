variable "project_id" {
  description = "The ID of the Google Cloud Project"
  type        = string
}

variable "region" {
  description = "Default region for resources"
  type        = string
  default     = "europe-west3" # Frankfurt
}
