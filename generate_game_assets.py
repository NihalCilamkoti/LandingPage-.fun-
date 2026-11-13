import math
import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = "/Users/nihalcilamkoti/Projects/LandingPage(.fun)/public/assets/game"

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def hex_to_rgba(hex_str, alpha=255):
    rgb = hex_to_rgb(hex_str)
    return (rgb[0], rgb[1], rgb[2], alpha)

# ==============================================================================
# 1. EFFECTS: sparkle.png & confetti.png
# ==============================================================================

def make_sparkle():
    size = (256, 256)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 128, 128

    # Outer soft halo
    for r in range(80, 0, -4):
        alpha = int((80 - r) * 2.2)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 208, 97, alpha))

    # 4 major diamond rays
    points = [
        (cx, 16), (cx + 18, cy - 18), (cx + 112, cy), (cx + 18, cy + 18),
        (cx, 240), (cx - 18, cy + 18), (cx - 112, cy), (cx - 18, cy - 18)
    ]
    draw.polygon(points, fill=(255, 248, 214, 255), outline=(203, 181, 123, 255))

    # 4 diagonal subtle rays
    diag = [
        (cx, cy - 8), (cx + 60, cy - 60), (cx + 8, cy), (cx + 60, cy + 60),
        (cx, cy + 8), (cx - 60, cy + 60), (cx - 8, cy), (cx - 60, cy - 60)
    ]
    draw.polygon(diag, fill=(255, 255, 255, 210))

    # Bright center core
    draw.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(255, 255, 255, 255))

    path = os.path.join(BASE_DIR, "effects/sparkle.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_confetti():
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    colors = [
        hex_to_rgba("#CBB57B", 240), hex_to_rgba("#10B981", 240),
        hex_to_rgba("#F59E0B", 240), hex_to_rgba("#8B5CF6", 240),
        hex_to_rgba("#F43F5E", 240), hex_to_rgba("#0EA5E9", 240),
        hex_to_rgba("#FFFFFF", 255)
    ]

    import random
    random.seed(42)

    for _ in range(160):
        cx = random.randint(20, 492)
        cy = random.randint(20, 492)
        w = random.randint(8, 20)
        h = random.randint(5, 12)
        angle = random.uniform(0, math.pi)
        col = random.choice(colors)

        # Draw rotated rectangle
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        pts = [
            (cx - w/2 * cos_a - -h/2 * sin_a, cy - w/2 * sin_a + -h/2 * cos_a),
            (cx + w/2 * cos_a - -h/2 * sin_a, cy + w/2 * sin_a + -h/2 * cos_a),
            (cx + w/2 * cos_a - h/2 * sin_a, cy + w/2 * sin_a + h/2 * cos_a),
            (cx - w/2 * cos_a - h/2 * sin_a, cy - w/2 * sin_a + h/2 * cos_a)
        ]
        draw.polygon(pts, fill=col)

    # Some curling ribbon spirals
    for _ in range(16):
        start_x = random.randint(40, 470)
        start_y = random.randint(30, 400)
        col = random.choice(colors)
        ribbon_pts = []
        for step in range(8):
            rx = start_x + math.sin(step * 0.8) * 15
            ry = start_y + step * 8
            ribbon_pts.append((rx, ry))
        if len(ribbon_pts) > 1:
            draw.line(ribbon_pts, fill=col, width=3)

    path = os.path.join(BASE_DIR, "effects/confetti.png")
    img.save(path, "PNG")
    print("Created:", path)

# ==============================================================================
# 2. CHARACTERS: mascot-idle.png, mascot-walk.png, mascot-celebrate.png
# ==============================================================================

def draw_mascot_base(draw, cx, cy, mood="idle"):
    # Outer Glow
    for r in range(180, 100, -8):
        alpha = int((180 - r) * 1.3)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(203, 181, 123, alpha))

    # 4-Point Star Body Points
    pts = [
        (cx, cy - 130), (cx + 38, cy - 38), (cx + 130, cy), (cx + 38, cy + 38),
        (cx, cy + 130), (cx - 38, cy + 38), (cx - 130, cy), (cx - 38, cy - 38)
    ]
    draw.polygon(pts, fill=(245, 208, 97, 255), outline=(203, 181, 123, 255))
    
    # Inner highlight star
    inner_pts = [
        (cx, cy - 100), (cx + 25, cy - 25), (cx + 100, cy), (cx + 25, cy + 25),
        (cx, cy + 100), (cx - 25, cy + 25), (cx - 100, cy), (cx - 25, cy - 25)
    ]
    draw.polygon(inner_pts, fill=(255, 242, 178, 255))

    # Party Hat
    draw.polygon([(cx - 20, cy - 90), (cx, cy - 150), (cx + 20, cy - 90)], fill=(16, 185, 129, 255), outline=(30, 40, 28, 255))
    draw.ellipse([cx - 8, cy - 158, cx + 8, cy - 142], fill=(245, 158, 11, 255))

    # Eyes & Expressions
    if mood == "celebrate":
        # Happy arched squint eyes ^ ^
        draw.arc([cx - 45, cy - 30, cx - 15, cy], start=180, end=360, fill=(30, 40, 28, 255), width=7)
        draw.arc([cx + 15, cy - 30, cx + 45, cy], start=180, end=360, fill=(30, 40, 28, 255), width=7)
        # Big open happy mouth
        draw.chord([cx - 25, cy + 5, cx + 25, cy + 38], start=0, end=180, fill=(30, 40, 28, 255))
        draw.ellipse([cx - 10, cy + 22, cx + 10, cy + 35], fill=(244, 63, 94, 255))
        # Raised Hands
        draw.ellipse([cx - 85, cy - 65, cx - 60, cy - 40], fill=(245, 158, 11, 255), outline=(203, 181, 123, 255))
        draw.ellipse([cx + 60, cy - 65, cx + 85, cy - 40], fill=(245, 158, 11, 255), outline=(203, 181, 123, 255))
    elif mood == "walk":
        # Focused happy eyes
        draw.ellipse([cx - 40, cy - 22, cx - 18, cy], fill=(30, 40, 28, 255))
        draw.ellipse([cx + 18, cy - 22, cx + 40, cy], fill=(30, 40, 28, 255))
        draw.ellipse([cx - 30, cy - 20, cx - 22, cy - 12], fill=(255, 255, 255, 255))
        draw.ellipse([cx + 28, cy - 20, cx + 36, cy - 12], fill=(255, 255, 255, 255))
        # Grinning mouth
        draw.arc([cx - 20, cy + 5, cx + 20, cy + 25], start=0, end=180, fill=(30, 40, 28, 255), width=5)
        # Running hands
        draw.ellipse([cx - 80, cy - 15, cx - 55, cy + 10], fill=(245, 158, 11, 255))
        draw.ellipse([cx + 55, cy + 20, cx + 80, cy + 45], fill=(245, 158, 11, 255))
    else: # idle
        # Big sparkling eyes
        draw.ellipse([cx - 38, cy - 22, cx - 16, cy], fill=(30, 40, 28, 255))
        draw.ellipse([cx + 16, cy - 22, cx + 38, cy], fill=(30, 40, 28, 255))
        draw.ellipse([cx - 28, cy - 20, cx - 20, cy - 12], fill=(255, 255, 255, 255))
        draw.ellipse([cx + 26, cy - 20, cx + 34, cy - 12], fill=(255, 255, 255, 255))
        # Sweet smile
        draw.arc([cx - 18, cy + 8, cx + 18, cy + 24], start=0, end=180, fill=(30, 40, 28, 255), width=5)
        # Resting hands
        draw.ellipse([cx - 75, cy + 15, cx - 50, cy + 40], fill=(245, 158, 11, 255))
        draw.ellipse([cx + 50, cy + 15, cx + 75, cy + 40], fill=(245, 158, 11, 255))

    # Rosy Cheeks
    draw.ellipse([cx - 60, cy + 2, cx - 40, cy + 15], fill=(244, 63, 94, 130))
    draw.ellipse([cx + 40, cy + 2, cx + 60, cy + 15], fill=(244, 63, 94, 130))

def make_mascot_idle():
    img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_mascot_base(draw, 256, 260, "idle")
    path = os.path.join(BASE_DIR, "characters/mascot-idle.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_mascot_walk():
    img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Motion dash marks behind
    draw.line([(60, 260), (120, 260)], fill=(203, 181, 123, 180), width=6)
    draw.line([(80, 290), (140, 290)], fill=(203, 181, 123, 180), width=6)
    draw_mascot_base(draw, 270, 250, "walk")
    path = os.path.join(BASE_DIR, "characters/mascot-walk.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_mascot_celebrate():
    img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Sparkles around
    for (sx, sy) in [(90, 80), (420, 90), (70, 380), (440, 360), (256, 40)]:
        draw.polygon([(sx, sy-16), (sx+5, sy-5), (sx+16, sy), (sx+5, sy+5), (sx, sy+16), (sx-5, sy+5), (sx-16, sy), (sx-5, sy-5)], fill=(255, 242, 178, 255))
    draw_mascot_base(draw, 256, 270, "celebrate")
    path = os.path.join(BASE_DIR, "characters/mascot-celebrate.png")
    img.save(path, "PNG")
    print("Created:", path)

# ==============================================================================
# 3. ENVIRONMENTS: playhouse-background.png & the 4 room scenes
# ==============================================================================

def make_playhouse_background():
    w, h = 1200, 800
    img = Image.new("RGBA", (w, h), (247, 243, 238, 255))
    draw = ImageDraw.Draw(img)

    # Soft gradient sky
    for y in range(500):
        t = y / 500
        r = int(247 * (1 - t) + 239 * t)
        g = int(243 * (1 - t) + 232 * t)
        b = int(238 * (1 - t) + 222 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Rolling green hills in the distance
    draw.chord([w//2 - 700, 360, w//2 + 700, 900], start=180, end=360, fill=(165, 178, 160, 200))
    draw.chord([w//2 - 900, 420, w//2 + 500, 1000], start=180, end=360, fill=(197, 205, 193, 220))
    draw.chord([w//2 - 400, 450, w//2 + 1000, 1100], start=180, end=360, fill=(229, 218, 214, 255))

    # Lawn Foreground
    draw.rectangle([0, 560, w, h], fill=(38, 52, 36, 255))

    # Festive Bunting Flags across top
    flag_colors = [(203, 181, 123), (16, 185, 129), (245, 158, 11), (139, 92, 246), (244, 63, 94)]
    c_y = 60
    draw.line([(0, c_y), (w, c_y)], fill=(30, 40, 28), width=3)
    for i, x in enumerate(range(40, w - 40, 55)):
        col = flag_colors[i % len(flag_colors)]
        draw.polygon([(x, c_y), (x + 40, c_y), (x + 20, c_y + 45)], fill=col, outline=(30, 40, 28))

    # Illustrated Clubhouse Silhouette / Pavilion in Center
    cw = 680
    ch = 380
    cx = (w - cw) // 2
    cy = 230
    # Main Pavilion Wall
    draw.rounded_rectangle([cx, cy + 90, cx + cw, cy + ch], radius=24, fill=(247, 243, 238), outline=(203, 181, 123), width=6)
    # Roof (Charming Timber / Forest Green Arch)
    draw.polygon([(cx - 40, cy + 90), (cx + cw + 40, cy + 90), (cx + cw // 2, cy - 30)], fill=(30, 40, 28), outline=(203, 181, 123))
    # Roof Crest Emblem
    draw.ellipse([cx + cw//2 - 32, cy + 20, cx + cw//2 + 32, cy + 84], fill=(203, 181, 123), outline=(255, 242, 178), width=4)

    # 4 Decorative Entrance Portals
    door_w = 90
    door_h = 140
    door_gap = 45
    start_dx = cx + 80
    portal_cols = [(245, 158, 11), (139, 92, 246), (16, 185, 129), (203, 181, 123)]
    for i in range(4):
        dx = start_dx + i * (door_w + door_gap)
        dy = cy + ch - door_h
        draw.rounded_rectangle([dx, dy, dx + door_w, dy + door_h], radius=16, fill=portal_cols[i], outline=(30, 40, 28), width=4)
        draw.ellipse([dx + door_w - 20, dy + door_h // 2, dx + door_w - 10, dy + door_h // 2 + 10], fill=(255, 242, 178))

    path = os.path.join(BASE_DIR, "environment/playhouse-background.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_game_room():
    w, h = 800, 600
    img = Image.new("RGBA", (w, h), (18, 25, 17, 255))
    draw = ImageDraw.Draw(img)

    # Neon Wall Lighting Grid
    for x in range(0, w, 40):
        draw.line([(x, 0), (x, 380)], fill=(245, 158, 11, 25))
    for y in range(0, 380, 40):
        draw.line([(0, y), (w, y)], fill=(245, 158, 11, 25))

    # Isometric Checkerboard Floor
    for y in range(380, h, 25):
        draw.line([(0, y), (w, y)], fill=(203, 181, 123, 70), width=2)
    for x in range(-200, w + 200, 60):
        draw.line([(x, 380), (x + 100, h)], fill=(203, 181, 123, 70), width=2)

    # Neon Sign: "GAME ROOM"
    draw.rounded_rectangle([w//2 - 160, 40, w//2 + 160, 110], radius=16, fill=(15, 23, 42), outline=(245, 158, 11), width=4)
    draw.text((w//2 - 110, 60), "ARCADE ROOM", fill=(255, 242, 178))

    # Silhouette Arcade Cabinets on sides
    draw.polygon([(40, 200), (140, 180), (140, 450), (40, 480)], fill=(30, 40, 28), outline=(16, 185, 129), width=3)
    draw.polygon([(660, 180), (760, 200), (760, 480), (660, 450)], fill=(30, 40, 28), outline=(244, 63, 94), width=3)

    path = os.path.join(BASE_DIR, "environment/game-room.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_puzzle_room():
    w, h = 800, 600
    img = Image.new("RGBA", (w, h), (26, 27, 48, 255))
    draw = ImageDraw.Draw(img)

    # Bookshelf Wall
    for y in [60, 150, 240, 330]:
        draw.rectangle([60, y, w - 60, y + 14], fill=(140, 83, 43), outline=(60, 30, 10))
        # Book spines
        for bx in range(80, w - 100, 24):
            b_col = [(139, 92, 246), (16, 185, 129), (245, 158, 11), (14, 165, 233)][(bx // 24) % 4]
            draw.rectangle([bx, y - 55, bx + 18, y], fill=b_col, outline=(30, 15, 5))

    # Wooden Floor
    draw.rectangle([0, 380, w, h], fill=(169, 113, 66))
    for x in range(0, w, 80):
        draw.line([(x, 380), (x, h)], fill=(113, 63, 29), width=2)

    # Blueprint Board in Center
    draw.rounded_rectangle([w//2 - 150, 80, w//2 + 150, 260], radius=12, fill=(30, 58, 138), outline=(96, 165, 250), width=4)
    draw.text((w//2 - 95, 160), "PUZZLE STUDIO", fill=(255, 255, 255))

    path = os.path.join(BASE_DIR, "environment/puzzle-room.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_event_world():
    w, h = 800, 600
    img = Image.new("RGBA", (w, h), (20, 28, 19, 255))
    draw = ImageDraw.Draw(img)

    # Convention Arena Lights & Trusses
    draw.line([(60, 60), (w - 60, 60)], fill=(148, 163, 184), width=6)
    for x in range(120, w - 100, 140):
        # Spotlight Cones
        draw.polygon([(x, 60), (x - 70, 360), (x + 70, 360)], fill=(255, 242, 178, 45))

    # Stage Platform
    draw.polygon([(80, 320), (w - 80, 320), (w - 40, 440), (40, 440)], fill=(45, 62, 43), outline=(203, 181, 123), width=3)
    draw.rectangle([40, 440, w - 40, 480], fill=(20, 28, 19), outline=(203, 181, 123), width=2)

    # Main Center LED Display
    draw.rounded_rectangle([w//2 - 180, 110, w//2 + 180, 280], radius=14, fill=(15, 23, 42), outline=(16, 185, 129), width=4)
    draw.text((w//2 - 100, 185), "EVENT WORLD", fill=(255, 255, 255))

    # Audience Floor
    draw.rectangle([0, 480, w, h], fill=(15, 20, 14))

    path = os.path.join(BASE_DIR, "environment/event-world.png")
    img.save(path, "PNG")
    print("Created:", path)

def make_rewards_room():
    w, h = 800, 600
    img = Image.new("RGBA", (w, h), (36, 26, 14, 255))
    draw = ImageDraw.Draw(img)

    # Golden Gallery Wall Pillars
    for x in [80, 240, 560, 720]:
        draw.rectangle([x - 20, 40, x + 20, 420], fill=(203, 181, 123), outline=(154, 132, 73), width=3)
        draw.polygon([(x - 30, 40), (x + 30, 40), (x, 20)], fill=(255, 242, 178))

    # Red Carpet Floor
    draw.rectangle([0, 420, w, h], fill=(30, 20, 12))
    draw.polygon([(w//2 - 180, h), (w//2 + 180, h), (w//2 + 90, 420), (w//2 - 90, 420)], fill=(190, 18, 60))

    # Grand Trophy Pedestal in Center
    draw.rectangle([w//2 - 80, 320, w//2 + 80, 460], fill=(247, 243, 238), outline=(203, 181, 123), width=4)
    draw.text((w//2 - 80, 160), "REWARDS GALLERY", fill=(255, 242, 178))

    path = os.path.join(BASE_DIR, "environment/rewards-room.png")
    img.save(path, "PNG")
    print("Created:", path)

if __name__ == "__main__":
    make_sparkle()
    make_confetti()
    make_mascot_idle()
    make_mascot_walk()
    make_mascot_celebrate()
    make_playhouse_background()
    make_game_room()
    make_puzzle_room()
    make_event_world()
    make_rewards_room()
    print("All assets generated successfully!")
