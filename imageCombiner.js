const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

class Args {
	constructor() {
		if (process.argv.length < 5) {
			console.log(
				'Not enough arguments. Usage: node program.js <image1_path> <image2_path> <output_filename>'
			);
			process.exit(1);
		}

		this.image1Path = process.argv[2];
		this.image2Path = process.argv[3];
		this.outputPath = process.argv[4];
	}
}

async function loadAndResizeImage(path, targetWidth, targetHeight) {
	const img = await loadImage(path);

	const aspectRatio = img.width / img.height;

	let newWidth = targetWidth;
	let newHeight = targetHeight;

	if (aspectRatio > 1) {
		newHeight = Math.round(targetWidth / aspectRatio);
	} else {
		newWidth = Math.round(targetHeight * aspectRatio);
	}

	const canvas = createCanvas(newWidth, newHeight);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(img, 0, 0, newWidth, newHeight);

	return canvas;
}

function combineImages(img1, img2) {
	const canvas = createCanvas(img1.width, img1.height);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(img1, 0, 0);

	const imgData1 = ctx.getImageData(0, 0, img1.width, img1.height);
	const imgData2 = img2
		.getContext('2d')
		.getImageData(0, 0, img2.width, img2.height);

	for (let x = 0; x < img1.width; x += 2) {
		for (let y = 0; y < img1.height; y++) {
			const i = (y * img1.width + x) * 4;
			const j = (y * img2.width + x) * 4;

			imgData1.data[i] = imgData2.data[j];
			imgData1.data[i + 1] = imgData2.data[j + 1];
			imgData1.data[i + 2] = imgData2.data[j + 2];
		}
	}

	ctx.putImageData(imgData1, 0, 0);

	return canvas;
}

function saveImage(path, canvas) {
	const out = fs.createWriteStream(path);
	const stream = canvas.createPNGStream();

	stream.pipe(out);
	out.on('finish', () => console.log('The PNG file was created.'));
}

async function run() {
	const args = new Args();

	const img1 = await loadAndResizeImage(args.image1Path, 400, 300);
	const img2 = await loadAndResizeImage(args.image2Path, 400, 300);

	const commonWidth = Math.min(img1.width, img2.width);
	const commonHeight = Math.min(img1.height, img2.height);

	const img1Resized = await loadAndResizeImage(
		args.image1Path,
		commonWidth,
		commonHeight
	);
	const img2Resized = await loadAndResizeImage(
		args.image2Path,
		commonWidth,
		commonHeight
	);

	const imgCombined = combineImages(img1Resized, img2Resized);

	const outputPath = path.join('images', args.outputPath);

	saveImage(outputPath, imgCombined);
}

run();

// node imageCombiner.js images/image1.png images/image2.png output.png
// node imageCombiner.js images/image3.png images/image4.png output.png
