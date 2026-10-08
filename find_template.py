import cv2
import numpy as np
import sys

img = cv2.imread('public/assets/characters/oga_2ndsheet_10_monsters_cp.png')
template = cv2.imread('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/.user_uploaded/media_1791438159841_5474b784.png')

# The user screenshot might be scaled, so we should look at the sizes
print(f"Img: {img.shape}, Template: {template.shape}")
