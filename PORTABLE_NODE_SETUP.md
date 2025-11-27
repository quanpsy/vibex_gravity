# 🛠️ How to Run vibeX with Portable Node.js
(The "Friend's Trick" to bypass admin restrictions)

If you cannot install Node.js normally, you can use the **Portable Version**. This is likely what your friend did!

## Step 1: Download Portable Node.js
1. Go to the [Node.js Download Page](https://nodejs.org/en/download/prebuilt-binaries).
2. Choose **Windows Binary (.zip)** (NOT the Installer).
3. Select **64-bit**.
4. Download the ZIP file.

## Step 2: "Install" it
1. Extract the ZIP file content.
2. You will see a folder named something like `node-v20.11.0-win-x64`.
3. **Copy all files** inside that folder.
4. **Paste them** into your project folder: `c:\Users\Student\Desktop\vibex\new-backend-vibex-v4`.
   - You should see `node.exe` and `npm` right next to your `package.json`.

## Step 3: Run the App
Now that `node.exe` is in the folder, you can run commands!

1. Open **Git Bash** (or Command Prompt) in this folder.
2. Run this command to set up the path (temporary):
   ```bash
   export PATH=$PATH:.
   ```
3. Install dependencies:
   ```bash
   ./npm install
   ```
4. Run the app:
   ```bash
   ./npm run dev
   ```

## Step 4: View the App
Open your browser and go to: `http://localhost:5173`

🚀 **That's it!** You are now running the full app locally without admin rights.
