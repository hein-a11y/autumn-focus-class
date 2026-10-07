from PIL import Image
import os

img = Image.open('../public/assets/town_rpg_pack/graphics/transparent-bg-tiles.png')
img = img.convert('RGBA')
data = img.load()
width, height = img.size

# simple script to find bounding boxes of non-transparent areas
# but wait, a building might have transparent parts in the middle.
# let's just save the image as base64 or something? No, I can't view it.
# How can I find the buildings?
# I'll just write a script that detects horizontal and vertical empty lines to form a grid, then extract cells.

rows = []
for y in range(height):
    is_empty = True
    for x in range(width):
        if data[x,y][3] > 0:
            is_empty = False
            break
    if is_empty:
        rows.append(y)

print('Empty rows:', rows)

cols = []
for x in range(width):
    is_empty = True
    for y in range(height):
        if data[x,y][3] > 0:
            is_empty = False
            break
    if is_empty:
        cols.append(x)

print('Empty cols:', cols)
