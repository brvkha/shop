# KhaLeo

Flashcard learning platform with Spring Boot backend, React frontend, and AWS deployment automation.

## Release Readiness Checklist

Before approving production release:

- [ ] Backend CI checks pass (`mvn test`, package build).
- [ ] Frontend CI checks pass (`lint`, `test:coverage`, `build`).
- [ ] Deploy workflows use OIDC role and environment `production` approval gate.
- [ ] Artifact SHA selected for release and documented.
- [ ] Runtime secrets exist in AWS Secrets Manager (`khaleo/prod/*`).
- [ ] Rollback SHA is identified and confirmed deployable.
- [ ] Post-deploy health checks pass (`/actuator/health`, frontend smoke).

## Core Paths

- Backend: `backend/`
- Frontend: `frontend/`
- Terraform: `infra/terraform/`
- Feature specs: `specs/`
