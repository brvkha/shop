package com.khaleo.flashcard.integration.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class RuntimeSecretAccessIT {

    @Test
    void shouldLoadProductionRuntimeSecretsFromGeneratedPropertiesFile() throws Exception {
        String applicationConfig = Files.readString(Path.of("src", "main", "resources", "application.yml"));

        assertThat(applicationConfig).contains("on-profile: production");
        assertThat(applicationConfig).contains("optional:file:/opt/khaleo/flashcard-backend/runtime-secrets.env[.properties]");
        assertThat(applicationConfig).contains("db-secret-id: ${DB_SECRET_ID:khaleo/prod/db-credentials}");
        assertThat(applicationConfig).contains("jwt-secret-id: ${JWT_SECRET_ID:khaleo/prod/jwt-secret}");
        assertThat(applicationConfig).contains("ses-secret-id: ${SES_SECRET_ID:khaleo/prod/ses-credentials}");
    }

    @Test
    void shouldPropagateSecretIdentifiersThroughDeployWorkflowAndScript() throws Exception {
        String workflow = Files.readString(Path.of("..", ".github", "workflows", "deploy-backend.yml"));
        String deployScript = Files.readString(Path.of("scripts", "deploy-via-ssm.sh"));

        assertThat(workflow).contains("DB_SECRET_ID: ${{ vars.DB_SECRET_ID }}");
        assertThat(workflow).contains("JWT_SECRET_ID: ${{ vars.JWT_SECRET_ID }}");
        assertThat(workflow).contains("SES_SECRET_ID: ${{ vars.SES_SECRET_ID }}");
        assertThat(workflow).contains("RUNTIME_ENV_PATH: ${{ vars.RUNTIME_ENV_PATH }}");
        assertThat(workflow).contains("/tmp/deploy-via-ssm.sh");

        assertThat(deployScript).contains("secretsmanager get-secret-value");
        assertThat(deployScript).contains("DB_URL=");
        assertThat(deployScript).contains("DB_USERNAME=");
        assertThat(deployScript).contains("DB_PASSWORD=");
        assertThat(deployScript).contains("JWT_SECRET=");
    }
}