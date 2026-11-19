import random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
PM, PF, OUT = sys.argv[1:4]
random.seed(3); W,H=1280,720
stops=[(5,7,15),(11,23,48),(28,51,88),(44,74,114)]
g=Image.new('RGB',(1,len(stops))); [g.putpixel((0,i),c) for i,c in enumerate(stops)]
img=g.resize((W,H),Image.BICUBIC).convert('RGBA')
lay=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(lay)
for _ in range(16):
    cx,cy=random.uniform(-100,W+100),random.uniform(80,H); rw,rh=random.uniform(150,420),random.uniform(40,110)
    d.ellipse([cx-rw,cy-rh,cx+rw,cy+rh],fill=(210,225,245,random.randint(25,60)))
img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(28)))
v=Image.new('L',(W,H),0); ImageDraw.Draw(v).ellipse([-300,-250,W+300,H+250],fill=255)
v=v.filter(ImageFilter.GaussianBlur(120)); dark=Image.new('RGBA',(W,H),(0,0,0,170)); img=Image.composite(img,Image.alpha_composite(img,dark),v)
def put(s,font,size,cy,fill,shadow):
    f=ImageFont.truetype(font,size); d=ImageDraw.Draw(img); bb=d.textbbox((0,0),s,font=f)
    x=(W-(bb[2]-bb[0]))/2-bb[0]; y=cy-(bb[3]+bb[1])/2
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).text((x+4,y+8),s,font=f,fill=shadow)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size*0.06))); ImageDraw.Draw(img).text((x,y),s,font=f,fill=fill)
put('ANUEL AA',PM,58,150,(255,255,255,255),(0,0,0,200))
put('Vuelve',PF,300,345,(160,16,26,255),(0,0,0,220))
put('(LETRA)',PM,78,560,(255,255,255,255),(70,0,10,230))
ImageDraw.Draw(img).text((1195,655),'AL',font=ImageFont.truetype(PM,36),fill=(255,255,255,200))
img.convert('RGB').save(OUT)
