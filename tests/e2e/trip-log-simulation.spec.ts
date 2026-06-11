import { test, expect } from '@playwright/test';

test.describe('Trip Log Form Simulations', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the trip log page
    await page.goto('/trip-log');
    // Ensure we are on the 'new' tab
    await expect(page.getByRole('heading', { name: /Submit New Pre\/Post Trip/i })).toBeVisible();
  });

  test('Simulation 1: Standard Pre-Trip Submission (All OK)', async ({ page }) => {
    // Fill basic info
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('Driver');
    await page.selectOption('select[name="route_id"]', { index: 1 });
    await page.locator('input[name="odometer"]').fill('12345');

    // Checklist - select 'Yes' for all Pre-Trip questions
    const radioGroups = await page.locator('input[type="radio"][value="Yes"]').all();
    for (const radio of radioGroups) {
        // Only click if it's visible (some might be hidden in other sections)
        if (await radio.isVisible()) {
            await radio.click();
        }
    }

    // Mandatory Photos - Mock file uploads
    const photoInputs = [
        'driverFrontTire', 'passengerFrontTire', 'driverRearTire', 'passengerRearTire',
        'front', 'driverSide', 'rear', 'passengerSide',
        'frontSeat', 'back', 'trunk'
    ];

    for (const inputName of photoInputs) {
        // Note: In a real environment, we'd provide a buffer. 
        // For simulation, we check if the inputs exist and are ready.
        const input = page.locator(`input[type="file"]`).nth(photoInputs.indexOf(inputName));
        await expect(input).toBeAttached();
    }

    await page.locator('textarea[name="notes"]').fill('Simulation: All checks passed.');
    
    // We won't actually click Submit to avoid polluting the DB during simulation unless specified,
    // but we verify the button is enabled and ready.
    const submitBtn = page.getByRole('button', { name: /Submit Log/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).not.toBeDisabled();
  });

  test('Simulation 2: Post-Trip with Reported Damage', async ({ page }) => {
    await page.selectOption('select[name="trip_type"]', 'Post-Trip');
    
    // Locate the "Any new damage to vehicle?" question
    // It's part of the dynamic mapping. We find the specific radio button.
    const damageQuestion = page.locator('div').filter({ hasText: /^Any new damage to vehicle\?$/ });
    await damageQuestion.locator('input[value="Yes"]').click();

    // Verify the "Describe issue" field appears
    const descriptionInput = page.getByPlaceholder(/Describe issue/i);
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill('Simulation: Found small scratch on passenger door.');

    // Verify it's marked as an issue visually (red background/border classes)
    const container = page.locator('div').filter({ hasText: /^Any new damage to vehicle\?$/ }).first();
    await expect(container).toHaveClass(/border-red-200/);
  });

  test('Simulation 3: Complex Med Returns Logic', async ({ page }) => {
    await page.selectOption('select[name="trip_type"]', 'Post-Trip');

    // Trigger Med Returns
    await page.locator('input[name="hadReturns"][value="Yes"]').click();

    // Verify conditional fields appear
    await expect(page.getByPlaceholder(/Per Nurse, patient discharged/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Overlook OLPAT1/i)).toBeVisible();
    
    // Fill required facility
    await page.getByPlaceholder(/Overlook OLPAT1/i).fill('Facility Simulation Alpha');

    // Handover check
    await page.locator('input[name="handedToPharmacy"][value="Yes"]').click();

    // Refrigeration logic
    await page.locator('input[name="needsRefrigeration"][value="Yes"]').click();
    
    // Verify follow-up appears
    const fridgeCheck = page.locator('span').filter({ hasText: 'Meds placed in refrigerator?' });
    await expect(fridgeCheck).toBeVisible();
    await page.locator('input[name="placedInFridge"][value="Yes"]').click();
  });

  test('Simulation 4: Full Tackle Box Complex Flow', async ({ page }) => {
    await page.selectOption('select[name="trip_type"]', 'Post-Trip');
    await page.selectOption('select[name="route_id"]', { index: 1 }); // Required to show locations

    // Step 1: Trigger Tackle Boxes
    await page.locator('input[name="tackle-included"][value="Yes"]').click();

    // Step 2: Select a location (the first one)
    const locationCheckbox = page.locator('input[type="checkbox"]').first();
    await locationCheckbox.check();

    // Step 3: Fill details for the selected location
    await expect(page.locator('h4.text-blue-800')).toBeVisible();
    await page.getByPlaceholder('Count').first().fill('3');

    // Select "Nurse not emptied" to trigger return logic
    await page.locator('input[name^="emptied-"][value="No"]').click();

    // Verify return protocols appear
    await expect(page.getByText('Tackle box returned to pharmacy?')).toBeVisible();
    await page.locator('input[type="checkbox"]').nth(1).check(); // The "returned to pharmacy" checkbox
    
    await expect(page.getByText('How many unemptied tackle boxes returned?')).toBeVisible();
    await page.locator('input[placeholder="Count"]').nth(1).fill('2');
  });

  test('Simulation 5: Form Validation (Missing Mandatory Photo)', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Validation');
    await page.locator('input[name="lastName"]').fill('Test');
    await page.selectOption('select[name="route_id"]', { index: 1 });
    
    // Fill everything but DONT upload any photos.
    // HTML5 validation or our manual checks should prevent submission.
    
    // Note: Since we use 'required' on ImageUploadInputs, standard browser behavior
    // would show a tooltip. We can check if the form is valid.
    const isFormValid = await page.evaluate(() => {
        const form = document.querySelector('form');
        return form ? form.checkValidity() : false;
    });
    
    expect(isFormValid).toBe(false);
  });
});
