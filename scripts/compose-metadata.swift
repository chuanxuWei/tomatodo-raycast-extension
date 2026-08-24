import AppKit
import Foundation

guard CommandLine.arguments.count == 3 else {
  fputs("Usage: compose-metadata.swift <input.png> <output.png>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let source = NSImage(contentsOf: inputURL) else {
  fputs("Unable to read input image\n", stderr)
  exit(1)
}

let canvasSize = NSSize(width: 2000, height: 1250)
let canvas = NSImage(size: canvasSize)
canvas.lockFocus()

let bounds = NSRect(origin: .zero, size: canvasSize)
let gradient = NSGradient(
  starting: NSColor(calibratedRed: 0.98, green: 0.92, blue: 0.84, alpha: 1),
  ending: NSColor(calibratedRed: 0.90, green: 0.72, blue: 0.60, alpha: 1)
)!
gradient.draw(in: bounds, angle: 12)

let maxHeight = canvasSize.height - 72
let scale = min((canvasSize.width - 160) / source.size.width, maxHeight / source.size.height)
let imageSize = NSSize(width: source.size.width * scale, height: source.size.height * scale)
let imageRect = NSRect(
  x: (canvasSize.width - imageSize.width) / 2,
  y: (canvasSize.height - imageSize.height) / 2,
  width: imageSize.width,
  height: imageSize.height
)

source.draw(in: imageRect, from: .zero, operation: .sourceOver, fraction: 1)
canvas.unlockFocus()

guard
  let tiff = canvas.tiffRepresentation,
  let bitmap = NSBitmapImageRep(data: tiff),
  let data = bitmap.representation(using: .png, properties: [:])
else {
  fputs("Unable to encode PNG\n", stderr)
  exit(1)
}

try data.write(to: outputURL)
