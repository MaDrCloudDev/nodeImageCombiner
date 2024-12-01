import fs from 'fs';
import { createCanvas, loadImage, Canvas } from 'canvas';
import path from 'path';
import readline from 'readline';

class Args {
	image1Path: string;
	image2Path: string;
	outputPath: string;

	constructor(
		image1Path: string,
		image2Path: string,
		outputPath: string
	) {
		this.image1Path = image1Path;
		this.image2Path = image2Path;
		this.outputPath = path.resolve(
			'images',
			outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`
		);
	}
}

// Load image file, with error-handling
async function loadImageWithPath(filePath: string) {
	try {
		return await loadImage(filePath);
	} catch (error) {
		throw new Error(
			`Failed to load image from ${filePath}: ${
				error instanceof Error ? error.message : error
			}`
		);
	}
}

// Normalize images to the same dimensions
async function loadAndResizeImage(
	filePath: string,
	targetWidth: number,
	targetHeight: number
): Promise<Canvas> {
	const img = await loadImageWithPath(filePath);

	const canvas = createCanvas(targetWidth, targetHeight);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

	return canvas;
}

// Combine images by alternating columns
function combineImages(img1: Canvas, img2: Canvas): Canvas {
	const canvas = createCanvas(img1.width, img1.height);
	const ctx = canvas.getContext('2d');

	// Render first image to canvas
	ctx.drawImage(img1, 0, 0);

	const imgData1 = ctx.getImageData(0, 0, img1.width, img1.height);
	const imgData2 = img2
		.getContext('2d')
		.getImageData(0, 0, img2.width, img2.height);

	// Combine alternating columns
	for (let x = 0; x < img1.width; x += 2) {
		for (let y = 0; y < img1.height; y++) {
			const i = (y * img1.width + x) * 4; // Image 1 pixel index
			const j = (y * img2.width + x) * 4; // Image 2 pixel index

			// Swap pixel data between images
			imgData1.data[i] = imgData2.data[j];
			imgData1.data[i + 1] = imgData2.data[j + 1];
			imgData1.data[i + 2] = imgData2.data[j + 2];
		}
	}

	ctx.putImageData(imgData1, 0, 0);

	return canvas;
}

// Save combined image to a file
function saveImage(filePath: string, canvas: Canvas): void {
	const out = fs.createWriteStream(filePath);
	const stream = canvas.createPNGStream();

	stream.pipe(out);
	out.on('finish', () => console.log('The PNG file was created.'));
}

// List all image files in the "images" folder
function getImageFiles(): string[] {
	const imageDir = path.resolve('images');
	return fs
		.readdirSync(imageDir)
		.filter((file) => file.match(/\.(jpg|jpeg|png)$/i));
}

// readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Ask user to enter image names and output file name (will be .png)
function askUserForInputs() {
	return new Promise<Args>((resolve, reject) => {
		const imageFiles = getImageFiles();

		if (imageFiles.length < 2) {
			console.log('Not enough images in the "images" folder.');
			process.exit(1);
		}

		rl.question(
			'Enter the name of image 1:\n' + imageFiles.join('\n') + '\n',
			(image1: string) => {
				rl.question(
					'Enter the name of image 2:\n' +
						imageFiles.join('\n') +
						'\n',
					(image2: string) => {
						rl.question(
							'Enter the name for the output image (without .png): ',
							(output: string) => {
								rl.close();
								resolve(
									new Args(
										path.resolve('images', image1.trim()),
										path.resolve('images', image2.trim()),
										output.trim()
									)
								);
							}
						);
					}
				);
			}
		);
	});
}

// Process image: loading, resizing, combining, and saving
async function processImages(args: Args): Promise<void> {
	const img1 = await loadImageWithPath(args.image1Path);
	const img2 = await loadImageWithPath(args.image2Path);

	// Find common width and height
	const commonWidth = Math.min(img1.width, img2.width);
	const commonHeight = Math.min(img1.height, img2.height);

	// Resize images to common width and height
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

	// Combine images
	const imgCombined = combineImages(img1Resized, img2Resized);

	// Save output image
	saveImage(args.outputPath, imgCombined);
}

// Run program
async function run() {
	try {
		const args = await askUserForInputs();
		await processImages(args);
	} catch (error) {
		console.error(
			'Error:',
			error instanceof Error ? error.message : error
		);
	}
}

run();
