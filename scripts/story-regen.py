#!/usr/bin/env python3
"""Rehace imágenes concretas: python3 scripts/story-regen.py plan.json clave1 clave2 ... (semilla nueva)"""
import json, os, sys, random, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("gen", os.path.join(ROOT, "scripts/sdxl_local.py")); g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
plan = json.load(open(sys.argv[1])); vert = plan.get("vertical", False); W, H = (576, 1024) if vert else (1024, 576)
SOLO = {"leo": "Leo alone, only one boy in the image,", "valeria": "only one girl,", "marco": "only one blond boy,", "mama": "only one woman,"}
for k in sys.argv[2:]:
    p = plan["images"][k]
    lead = ""
    present = [c for c in plan.get("chars", {}) if "{" + c + "}" in p]
    if len(present) == 1 and present[0] in SOLO: lead = "solo portrait composition, " + SOLO[present[0]] + " "
    for c, d in plan.get("chars", {}).items(): p = p.replace("{" + c + "}", d)
    g.gen(os.path.join(ROOT, "public/historia/img", k + ".jpg"), lead + p + ", " + plan.get("style", ""), W, H, random.randint(1, 10**6))
    print("ok", k, flush=True)
