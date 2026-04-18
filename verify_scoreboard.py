import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        # Navigate to the app (assuming it's running on 3000)
        await page.goto("http://localhost:3000")

        # Create a team and a game if needed, or just navigate if state persists
        # For now, let's assume we can find a game or create one

        # Navigate to a game tracking page
        # We might need to click around to get to GameMode
        try:
            await page.click("text=Navigate to Teams")
            await page.click("text=Test Team") # Assuming one exists
            await page.click("text=New Game")
            await page.fill('input[name="opponent"]', "Opponent")
            await page.click("text=Next")
            await page.click("text=Next")
            await page.click("text=Next")
            await page.click("text=Start Game")

            # Wait for GameMode to load
            await page.wait_for_selector('text=OPPONENT')

            # Take screenshot of the new scoreboard
            await page.screenshot(path="scoreboard_redesign.png")
            print("Scoreboard screenshot saved.")

            # Click the clock to open Edit Clock dialog
            # The clock is something like "10:00"
            await page.click("text=10:00")
            await page.wait_for_selector("text=Edit Clock")
            await page.screenshot(path="edit_clock_dialog.png")
            print("Edit Clock dialog screenshot saved.")

        except Exception as e:
            print(f"Error during playwright: {e}")
            # Take a failure screenshot
            await page.screenshot(path="playwright_failure.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
