import {test, expect, Page} from '@playwright/test';
import { selectors } from "./helpers/selectors";
import {authorize, login} from "./helpers/operations";
import { testS3Credentials } from "./testCredentials"

const selectFile = async (page: Page, pathToFile: string, triggerButton: string) => {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click(triggerButton);
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(pathToFile);
}

// be aware that private sensitive info is used for the operation, avoid sharing these credentials
const s3jsonObject = `{ \"Bucket\": \"${testS3Credentials.s3BucketName}\", \"credentials\": { \"accessKeyId\": \"${testS3Credentials.accessKeyId}\", \"secretAccessKey\": \"${testS3Credentials.secretAccessKey}\" }, \"region\": \"${testS3Credentials.region}\", \"signatureVersion\": \"v4\", \"s3ForcePathStyle\": true }`

test.describe('<App/>', () => {
  test.beforeEach(async ({ page }) => {
    await authorize(page);
  });

  test('renders initially', async ({ page }) => {
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
  });

  test('able to perform file Encrypt/Upload and then Download/Decrypt', async ({ page }) => {
    await expect(page.locator(selectors.tokenMessage)).toBeVisible()
    const logoutButton = page.locator(selectors.logoutButton);
    expect(logoutButton).toBeTruthy();

    const emptyTablePlaceholder = page.locator(selectors.filesTableItem, {hasText: 'No uploaded files'})
    await expect(emptyTablePlaceholder).toBeVisible()

    await test.step('Select a file and assert its presence', async() => {
      await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
      await expect(page.locator(selectors.uploadedFileName)).toHaveText("fileforupload.docx")
    })

    await test.step('Fill configuration object field', async() => {
      await page.fill(selectors.s3ObjectInput, s3jsonObject)
    })

    // upload may fail due to CORS issues on the S3 bucket side, please follow the Readme to solve that
    await test.step('Perform Encrypt/Upload operation and assert responses', async() => {
      const publicKeyPromise = page.waitForResponse('**/kas_public_key');
      await page.click(selectors.encryptAndUploadButton)
      const publicKeyResponse = await publicKeyPromise;
      await expect(publicKeyResponse.status()).toBeTruthy()
    })

    await test.step('Assert adding of table item', async() => {
      const addedTableItem = page.locator(selectors.filesTableItem, {hasText: 'fileforupload.docx'})
      await expect(addedTableItem).toBeVisible()
    })

    await test.step('Perform Download/Decrypt operation and assert responses', async() => {
      const rewrapPromise = page.waitForResponse('**/rewrap');
      await page.click(selectors.downloadAndDecryptButton)
      const rewrapResponse = await rewrapPromise;
      await expect(rewrapResponse.status()).toBeTruthy()
    })
  });

  test('proper error notification is shown on uploading file if file is not selected', async ({ page }) => {
    await page.fill(selectors.s3ObjectInput, s3jsonObject)

    await page.click(selectors.encryptAndUploadButton)

    const fileMissingMsg = page.locator(selectors.alertMessage, {hasText: 'Please select a file to upload/encrypt.'})
    await expect(fileMissingMsg).toBeVisible()
  });

  test('proper error notifications are shown on uploading file if S3 object creds are not filled', async ({ page }) => {
    await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
    await page.click(selectors.encryptAndUploadButton)

    const s3ObjectMissingMsg = page.locator(selectors.alertMessage, {hasText: `Please enter a valid S3 compatible json object.`})
    await expect(s3ObjectMissingMsg).toBeVisible()
  });

  test('able to perform log out', async ({ page }) => {
    await page.fill(selectors.s3ObjectInput, s3jsonObject)

    await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)

    await Promise.all([
      page.waitForNavigation(),
      page.click(selectors.logoutButton),
    ])
    await page.waitForSelector(selectors.loginButton);

    // check that data disappears
    await expect(page.locator(selectors.s3ObjectInput)).toBeEmpty()
  });
});

test.describe('<Login/>', () => {
  test('is failed when using blank values', async ({ page }) => {
    await login(page, "", "")
    await expect(page.locator(selectors.loginScreen.errorMessage)).toBeVisible();
  });

  test('is failed when using wrong username', async ({ page }) => {
    await login(page, "non-existed-username", "testuser123")
    await expect(page.locator(selectors.loginScreen.errorMessage)).toBeVisible();
  });

  test('is failed when using wrong password', async ({ page }) => {
    await login(page, "user1", "wrong-password")
    await expect(page.locator(selectors.loginScreen.errorMessage)).toBeVisible();
  });

  test('proper error notification is shown on uploading file if user is not logged in', async ({ page }) => {
    await page.goto("/secure-remote-storage")
    await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
    await page.fill(selectors.s3ObjectInput, s3jsonObject)
    await page.click(selectors.encryptAndUploadButton)

    const userNotLoggedMsg = page.locator(selectors.alertMessage, {hasText: `You must login to perform this action.`})
    await expect(userNotLoggedMsg).toBeVisible()
  });
});