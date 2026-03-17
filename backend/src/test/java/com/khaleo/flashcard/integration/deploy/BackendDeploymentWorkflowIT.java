package com.khaleo.flashcard.integration.deploy;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class BackendDeploymentWorkflowIT {

    @Test
    void shouldKeepImmutableShaArtifactPathAndSsmPollingContract() throws Exception {
        String workflow = Files.readString(Path.of("..", ".github", "workflows", "deploy-backend.yml"));

        assertThat(workflow).contains("workflow_dispatch");
        assertThat(workflow).contains("environment: production");
        assertThat(workflow).contains("backend/${{ steps.sha.outputs.value }}/app.jar");
        assertThat(workflow).contains("aws ssm send-command");
        assertThat(workflow).contains("aws ssm list-command-invocations");
        assertThat(workflow).contains("failed_targets");
        assertThat(workflow).contains("Rollback Guidance");
    }
}
