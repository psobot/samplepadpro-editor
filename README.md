# Alesis SamplePad Pro Editor

This is a Javascript app (currently node, soon in-browser) for editing Alesis SamplePad kit files.

It currently supports decoding and encoding `.KIT` files from the [Alesis SamplePad Pro](http://alesis.com/products/view2/samplepad-pro), but could potentially support the [SamplePad 4](http://alesis.com/products/view2/samplepad-4) and [SampleRack](http://alesis.com/products/view/samplerack) as well.

## Development

On macOS:

```bash
brew install node
npm install-g brunch
npm install
node test.js < my_kit_file_here.kit
```

To run the development server locally:

```bash
brunch watch --server
```
