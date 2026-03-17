import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('frontend deploy workflow keeps immutable SHA and invalidates CloudFront', async () => {
  const workflowPath = path.resolve(process.cwd(), '..', '.github', 'workflows', 'deploy-frontend.yml')
  const workflow = await readFile(workflowPath, 'utf8')

  expect(workflow).toContain('workflow_dispatch')
  expect(workflow).toContain('environment: production')
  expect(workflow).toContain('Resolve deployment SHA')
  expect(workflow).toContain('ref: ${{ steps.sha.outputs.value }}')
  expect(workflow).toContain('aws s3 sync frontend/dist')
  expect(workflow).toContain('aws cloudfront create-invalidation')
  expect(workflow).toContain('Artifact SHA: ${{ steps.sha.outputs.value }}')
  expect(workflow).toContain('Invalidation ID: ${{ steps.invalidate.outputs.invalidation_id }}')
})
