import {test, expect, Page} from '@playwright/test';
import { selectors } from "./helpers/selectors";
import {authorize, login} from "./helpers/operations";
import { testS3Credentials } from "./testCredentials"
import * as fs from "fs";

const selectFile = async (page: Page, pathToFile: string, triggerButton: string) => {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click(triggerButton);
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(pathToFile);
}

// be aware that private sensitive info is used for the operation, avoid sharing these credentials
const s3jsonObject = `{ \"Bucket\": \"${testS3Credentials.s3BucketName}\", \"credentials\": { \"accessKeyId\": \"${testS3Credentials.accessKeyId}\", \"secretAccessKey\": \"${testS3Credentials.secretAccessKey}\" }, \"region\": \"${testS3Credentials.region}\", \"signatureVersion\": \"v4\", \"s3ForcePathStyle\": true }`

// example object doesn't contain valid existed data
const exampleS3JsonObject = "{ \"Bucket\": \"myBucketName\", \"credentials\": { \"accessKeyId\": \"IELVUWIEUD7U99JHPPES\", \"secretAccessKey\": \"N7RTPIqNRR7iqRo/a9WnrXryq7hSQvpCjVueRXLo\" }, \"region\": \"us-east-2\", \"signatureVersion\": \"v4\", \"s3ForcePathStyle\": true }"

// next values are aligned with values from Minio server launch script
const minioServerEndpoint = "http://s3.testminio.com"
const minioBucketName = "testbucketname"
const minioAccessKeyId = "storage-testing"
const minioSecretAccessKey = "storage-testing-pass"
const minioServerRegion = "us-east-1"
const minioConfigObject = `{ \"endpoint\": \"${minioServerEndpoint}\", \"Bucket\": \"${minioBucketName}\", \"credentials\": { \"accessKeyId\": \"${minioAccessKeyId}\", \"secretAccessKey\": \"${minioSecretAccessKey}\" }, \"region\": \"${minioServerRegion}\", \"signatureVersion\": \"v4\", \"s3ForcePathStyle\": true, \"useSSL\": false }`

test.describe('<App/>', () => {
  test.beforeEach(async ({ page }) => {
    await authorize(page);
  });

  test('renders initially', async ({ page }) => {
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
  });

  test('able to perform file Encrypt/Upload and then Download/Decrypt, able to replace target file', async ({ page }) => {
    const originalFile = 'fileforupload.docx'
    const replacementFile = 'fileForReplacement.jpeg'

    await expect(page.locator(selectors.tokenMessage)).toBeVisible()
    const logoutButton = page.locator(selectors.logoutButton);
    expect(logoutButton).toBeTruthy();

    const emptyTablePlaceholder = page.locator(selectors.filesTableItem, {hasText: 'No uploaded files'})
    await expect(emptyTablePlaceholder).toBeVisible()

    await test.step('Fill configuration object field', async() => {
      await page.fill(selectors.s3ObjectInput, minioConfigObject)
    })

    await test.step('Select a file and assert its presence', async() => {
      await selectFile(page, `tests/e2e/${originalFile}`, selectors.selectFileButton)
      await expect(page.locator(selectors.uploadedFileName)).toHaveText(originalFile)
    })

    await test.step('Replace a file', async() => {
      await selectFile(page, `tests/e2e/${replacementFile}`, selectors.selectFileButton)
      const replacedFile = page.locator(selectors.uploadedFileName, {hasText: replacementFile})
      await expect(replacedFile).toBeVisible()
    })

    // upload may fail due to CORS issues on the S3 bucket side, please follow the Readme to solve that
    await test.step('Perform Encrypt/Upload operation and assert responses', async() => {
      const publicKeyPromise = page.waitForResponse('**/kas_public_key');
      await page.click(selectors.encryptAndUploadButton)
      const publicKeyResponse = await publicKeyPromise;
      await expect(publicKeyResponse.status()).toBeTruthy()
    })

    await test.step('Assert adding of table item', async() => {
      const addedTableItem = page.locator(selectors.filesTableItem, {hasText: `${replacementFile}.tdf`})
      await expect(addedTableItem).toBeVisible()
    })

    await test.step('Perform Download/Decrypt operation, assert filename, size and responses', async() => {
      const rewrapPromise = page.waitForResponse('**/rewrap');
      const [ download ] = await Promise.all([
        page.waitForEvent('download'),
        page.click(selectors.downloadAndDecryptButton),
      ]);
      const rewrapResponse = await rewrapPromise;
      await expect(rewrapResponse.status()).toBeTruthy()

      expect(download.suggestedFilename()).toBe(`${replacementFile}.tdf.decrypted`);
      expect((await fs.promises.stat(await download.path() as string)).size).toBeGreaterThan(185000);
    })
  });

  test('be able to save remote store and select it to use', async ({ page }) => {
    const addedStoreItemWithDefaultName = page.locator(selectors.selectStoreDialog.storeTableItem, {hasText: '1'})
    const addedStoreItemWithCustomName = page.locator(selectors.selectStoreDialog.storeTableItem, {hasText: 'TestName'})

    await test.step('Open Save Store dialog and check its empty state', async() => {
      await page.fill(selectors.s3ObjectInput, minioConfigObject)
      await page.click(selectors.selectRemoteStoreDropdownButton)

      const noSavedItemsInfo = page.locator('.ant-empty-description', {hasText: 'No data'})
      await expect(noSavedItemsInfo).toBeVisible()
    })

    await test.step('Save remote store without defining a name and assert adding an item', async() => {
      await page.click(selectors.selectStoreDialog.saveStoreButton)
      await expect(addedStoreItemWithDefaultName).toBeVisible()
    })

    await test.step('Assert table item is present after reopening the dialog', async() => {
      await page.keyboard.press('Escape')
      await page.click(selectors.selectRemoteStoreDropdownButton)
      await expect(addedStoreItemWithDefaultName).toBeVisible()
    })

    await test.step('Save remote store with custom name', async() => {
      await page.locator(selectors.s3ObjectInput).clear()
      await page.fill(selectors.s3ObjectInput, exampleS3JsonObject)
      await page.click(selectors.selectRemoteStoreDropdownButton)
      await page.fill(selectors.selectStoreDialog.storeNameInputField, 'TestName')
      await page.click(selectors.selectStoreDialog.saveStoreButton)
    })

    await test.step('Assert adding of second store table item', async() => {
      await expect(addedStoreItemWithCustomName).toBeVisible()
    })

    await test.step('Select a table item and check proper value of s3 object input', async() => {
      await addedStoreItemWithDefaultName.click()
      await expect(page.locator(selectors.s3ObjectInput)).toHaveText(minioConfigObject)
    })
  });

  test('proper tooltip is shown on hover s3 object description', async ({ page }) => {
    await page.hover(selectors.s3ObjectFieldTitle)
    await expect(page.locator(selectors.s3ObjectTooltip)).toBeVisible()
    await expect(page.locator(selectors.s3ObjectTooltip)).toHaveText(`Example: ${exampleS3JsonObject}`)
  });

  test('proper error notification is shown on saving a remote store if s3 object is not defined', async ({ page }) => {
    await page.click(selectors.selectRemoteStoreDropdownButton)
    await page.click(selectors.selectStoreDialog.saveStoreButton)

    const s3ObjectMissingMsg = page.locator(selectors.alertMessage, {hasText: `Please enter a valid S3 compatible json object.`})
    await expect(s3ObjectMissingMsg).toBeVisible()
  });

  test('proper error notification is shown on uploading file if file is not selected', async ({ page }) => {
    await page.fill(selectors.s3ObjectInput, minioConfigObject)

    await page.click(selectors.encryptAndUploadButton)

    const fileMissingMsg = page.locator(selectors.alertMessage, {hasText: 'Please select a file to upload/encrypt.'})
    await expect(fileMissingMsg).toBeVisible()
  });

  // TODO: skipped because of PLAT-2271 bug in the app. Enable back after fixing
  test.skip('proper error notification is shown on uploading if file was deleted', async ({ page }) => {
    await page.fill(selectors.s3ObjectInput, minioConfigObject)

    await test.step('Select a file', async() => {
      await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
      await expect(page.locator(selectors.uploadedFileName)).toHaveText("fileforupload.docx")
    })

    await test.step('Delete the file', async() => {
      await page.hover(selectors.uploadedFileName)
      await page.click(selectors.deleteFileIcon)
    })

    await test.step('Initiate upload', async() => {
      await page.click(selectors.encryptAndUploadButton)
    })

    await test.step('Assert proper error notification', async() => {
      const fileMissingMsg = page.locator(selectors.alertMessage, {hasText: 'Please select a file to upload/encrypt.'})
      await expect(fileMissingMsg).toBeVisible()
    })
  });

  test('proper error notification is shown on uploading file if S3 config object is not set', async ({ page }) => {
    await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
    await page.click(selectors.encryptAndUploadButton)

    const s3ObjectMissingMsg = page.locator(selectors.alertMessage, {hasText: `Please enter a valid S3 compatible json object.`})
    await expect(s3ObjectMissingMsg).toBeVisible()
  });

  test('proper error notification is shown if wrong format of S3 object is used', async ({ page }) => {
    const invalidS3Object = "{\"key\": value}"

    await selectFile(page, 'tests/e2e/fileforupload.docx', selectors.selectFileButton)
    await page.fill(selectors.s3ObjectInput, invalidS3Object)
    await page.click(selectors.encryptAndUploadButton)

    const s3ObjectMissingMsg = page.locator(selectors.alertMessage, {hasText: `Please enter a valid S3 compatible json object.`})
    await expect(s3ObjectMissingMsg).toBeVisible()
  });

  test('able to perform log out', async ({ page }) => {
    await page.fill(selectors.s3ObjectInput, minioConfigObject)

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
    await page.fill(selectors.s3ObjectInput, minioConfigObject)
    await page.click(selectors.encryptAndUploadButton)

    const userNotLoggedMsg = page.locator(selectors.alertMessage, {hasText: `You must login to perform this action.`})
    await expect(userNotLoggedMsg).toBeVisible()
  });

  test('proper error notification is shown on saving a store if user is not logged in', async ({ page }) => {
    await page.goto("/secure-remote-storage")
    await page.fill(selectors.s3ObjectInput, minioConfigObject)
    await page.click(selectors.selectRemoteStoreDropdownButton)
    await page.click(selectors.selectStoreDialog.saveStoreButton)

    const userNotLoggedMsg = page.locator(selectors.alertMessage, {hasText: `You must login to perform this action.`})
    await expect(userNotLoggedMsg).toBeVisible()
  });
});