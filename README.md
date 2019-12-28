A puppeteer (headless browser) script that downloads the material of a course hosted on the MET (GUC) website, and organizes the materials into their respective folders accordingly.

## How to run

After cloning, install the dependencies by running

```bash
npm install
```

For now, you can use the following example (this definitely needs improvements of input capturing):

```bash
npm start YOUR_GUC_EMAIL:YOUR_MET_PASSWORD COURSE_MATERIAL_URL
```

Where COURSE_MATERIAL_URL points the to the URL of the materials page (eg. http://met.guc.edu.eg/Courses/Material.aspx?crsEdId=954)
