import random, math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FONT=sys.argv[1]; OUT=sys.argv[2]
random.seed(7)
STOPS=[(0,(36,34,92)),(0.35,(92,58,130)),(0.62,(196,70,120)),(0.8,(236,84,104)),(1,(244,140,128))]
def col(t):
    for (a,ca),(b,cb) in zip(STOPS,STOPS[1:]):
        if t<=b:
            k=(t-a)/(b-a); return tuple(int(ca[i]+(cb[i]-ca[i])*k) for i in range(3))
    return STOPS[-1][1]
def sky(w,h):
    g=Image.new('RGB',(1,256))
    for y in range(256): g.putpixel((0,y),col(y/255))
    img=g.resize((w,h),Image.BICUBIC)
    # soft cloud streaks
    lay=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(lay)
    for _ in range(40):
        cy=random.uniform(0.45,0.95)*h; cx=random.uniform(-0.2,1.2)*w
        rw=random.uniform(0.15,0.5)*w; rh=random.uniform(0.01,0.04)*h
        c=random.choice([(255,90,120),(255,150,140),(120,70,150),(255,120,160)])
        d.ellipse([cx-rw,cy-rh,cx+rw,cy+rh],fill=c+(random.randint(40,90),))
    lay=lay.filter(ImageFilter.GaussianBlur(h*0.03))
    img=Image.alpha_composite(img.convert('RGBA'),lay)
    # grain
    n=Image.effect_noise((w,h),22).convert('L')
    img=Image.blend(img,Image.merge('RGBA',(n,n,n,Image.new('L',(w,h),255))),0.05)
    return img
def text(img,s,size,cy,cx=None,spacing=0):
    w,h=img.size; f=ImageFont.truetype(FONT,size)
    d=ImageDraw.Draw(img); bb=d.textbbox((0,0),s,font=f)
    tw=bb[2]-bb[0]; x=(cx if cx is not None else w/2)-tw/2-bb[0]; y=cy-(bb[3]+bb[1])/2
    sh=Image.new('RGBA',img.size,(0,0,0,0)); ImageDraw.Draw(sh).text((x+size*0.04,y+size*0.06),s,font=f,fill=(20,10,40,170))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size*0.05)))
    d.text((x,y),s,font=f,fill=(255,255,255,255))
def sun(img,cx,cy,r):
    lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.ellipse([cx-r*1.8,cy-r*1.8,cx+r*1.8,cy+r*1.8],fill=(255,170,140,70))
    lay=lay.filter(ImageFilter.GaussianBlur(r*0.6)); img.alpha_composite(lay)
    d=ImageDraw.Draw(img); d.pieslice([cx-r,cy-r,cx+r,cy+r],180,360,fill=(255,214,170,255))
a=sky(800,800)
sun(a,400,560,190)
d=ImageDraw.Draw(a)
for i,yy in enumerate([520,480,445]):
    d.rectangle([200,yy,600,yy+14-i*4],fill=col(0.62+ (yy-445)/1000)+(255,))
d.line([150,560,650,560],fill=(255,255,255,230),width=8)
text(a,'AL',300,330)
text(a,'LETRAS',70,650)
a.convert('RGB').save(f'{OUT}/foto_perfil_800x800.png')
# circle preview
m=Image.new('L',(800,800),0); ImageDraw.Draw(m).ellipse([0,0,800,800],fill=255)
c=Image.new('RGBA',(800,800),(0,0,0,0)); c.paste(a,(0,0),m); c.save(f'{OUT}/preview_perfil_circular.png')
# --- Banner 2560x1440 (safe area 1546x423 centred)
b=sky(2560,1440)
sun(b,1280,900,230)
d=ImageDraw.Draw(b)
d.line([0,900,2560,900],fill=(255,255,255,90),width=4)
text(b,'ATARDECER LETRAS',190,640)
text(b,'LETRAS DE CANCIONES  ·  VÍDEOS LARGOS  ·  NUEVOS CADA SEMANA',46,790)
b.convert('RGB').save(f'{OUT}/banner_2560x1440.png')
# --- Lyric frame template 1920x1080
v=sky(1920,1080)
text(v,'AQUÍ VA LA FRASE DE LA CANCIÓN',92,540)
f=ImageFont.truetype(FONT,44); d=ImageDraw.Draw(v); d.text((1700,990),'AL',font=f,fill=(255,255,255,200))
v.convert('RGB').save(f'{OUT}/plantilla_video_1920x1080.png')
# thumbnail
t=sky(1280,720)
text(t,'TÍTULO',200,330); text(t,'ARTISTA FT. ARTISTA',60,480)
t.convert('RGB').save(f'{OUT}/plantilla_miniatura_1280x720.png')
