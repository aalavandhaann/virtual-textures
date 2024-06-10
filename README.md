# Sparse Virtual Texturing

This is an attempt to make sparse virtual texturing. There are two solutions enclosed within this repository

## Solution 1: threejs based code to showcase the idea behind paging of textures

Originally, an 8K texture is loaded on a plane. Depending on the LOD and tileSize only the portion of the texture that needs to be visible based on frustum culling is rendered. This is efficient towards run-time memory optimizations. However, there are better ways to implement the technique within GLSL shader and see [this](https://studiopixl.com/2022-04-27/sparse-virtual-textures).

Complementarily, SVT can also be combined with mipmapping to ensure optimizations on multiple levels. Because the central idea is that with a high resolution texture only a portion of it is visible at extreme zoom levels. With mipmapping instead of tiling or paging a high resolution texture it will operate on a mipmapped lower resolution texture. However, the question of loading a mipmapped texture is still problematic if you have multiple levels of mipmapping. Remember with mipmapping the textures are either vertically or horizontally stacked thereby increasing the size of the texture multiple folds. 

## Solution 2: A python script to create mipmapped texture

Use the python script ``` mipmap-generator.py``` to generate mipmapped textures. This script can be used with any type of textures (PBR format). Fire the commandline (ensure python is installed) and execute the script with the arguments for input path to image that needs to mipmapped combined with another argument for output path where the image needs to be saved. 