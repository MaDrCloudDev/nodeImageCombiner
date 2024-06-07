# nodeImageCombiner

Intall:

```
npm i
```

Run the program with your images:

```
ts-node imageCombiner.ts images/image3.png images/image4.png output.png
```

We're making the images the same size (which sometimes results in offset images, I'll try to fix that), then combining the images using every-other(ish) column of pixels from each image. I adapted it from my [rust_image_combiner](https://github.com/MaDrCloudDev/rust_image_combiner), which was a code-along to one of the freeCodeCamp tutorials.

Not really intended to be a useful program (unless you like the every-other-column-of-pixels effect). I wanted to build the same CLI program in Node, GO, and Rust.
