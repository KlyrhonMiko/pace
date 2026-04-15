import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function run() {
    const fileParts = "d:\\projects\\pace\\Ceejay_Feruelo (4).pdf";
    const buffer = fs.readFileSync(fileParts);

    const parser = new PDFParse({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        disableFontFace: false,
        useSystemFonts: true,
    });

    const textResult = await parser.getText({});
    fs.writeFileSync("d:\\projects\\pace\\frontend\\parsed-output.txt", textResult.text);
    console.log("Wrote text to parsed-output.txt");
}

run().catch(console.error);
