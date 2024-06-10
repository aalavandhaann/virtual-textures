import argparse
import pathlib

from PIL import Image


def getArguments():
    # Create argument parser
    parser = argparse.ArgumentParser(description="Generate texture atlas with mipmaps for an 8K texture")
    parser.add_argument("-i", "--input", dest="input", type=pathlib.Path, help="Path to the input 8K texture image", required=True)
    parser.add_argument("-o", "--output", dest="output", type=pathlib.Path, help="Path to save the texture atlas image", required=True)
    
    # Parse the command-line arguments
    args = parser.parse_args()
    
    return args

def generate_texture_atlas(image_path: pathlib.Path, output_path: pathlib.Path):
    """
    Generate a texture atlas with mipmaps for an 8K texture.

    :param image_path: Path to the 8K texture image.
    :param output_path: Path to save the texture atlas image.
    """
    # Open the original image
    original_image: Image = Image.open(image_path)
    
    # Get the original size
    width, height = original_image.size
    
    # Ensure the input is an 8K texture
    if width != 8192 or height != 8192:
        raise ValueError("Input image is not 8K resolution (8192x8192)")

    # Create an empty image to store the texture atlas
    atlas_width: int = width
    atlas_height: int = height
    num_levels: int = 1
    
    while atlas_width > 1 and atlas_height > 1:
        num_levels += 1
        atlas_width //= 2
        atlas_height //= 2

    # Create the texture atlas
    atlas = Image.new("RGB", (width, height * num_levels))

    # Paste each mipmap level into the texture atlas
    offset_y: int = 0
    
    for level in range(num_levels):
        # Resize the image for the current mipmap level
        resized_image = original_image.resize((width, height), Image.ANTIALIAS)

        # Paste the resized image into the texture atlas
        atlas.paste(resized_image, (0, offset_y))

        # Halve the dimensions for the next level
        width //= 2
        height //= 2
        offset_y += height

    # Save the texture atlas
    atlas.save(output_path, format='PNG')
    print(f"Texture atlas with mipmaps saved at {output_path}")


if __name__ == '__main__':
    args = getArguments()
    if(args.output):
        args.output.parent.mkdir(exist_ok=True, parents=True)
    print(args.input, args.output)

    generate_texture_atlas(args.input, args.output)
