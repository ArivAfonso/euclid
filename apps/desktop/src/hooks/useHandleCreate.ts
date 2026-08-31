import { storeToRefs } from "pinia";
import { unref } from "vue";
import { useFabricStore, useTemplatesStore } from "@/store";
import { useMainStore } from "@/store/modules/main";
import { RightStates, ElementNames } from "@/types/elements";
import { nanoid } from "nanoid";
import { QRCodeElement, QRCodeOption } from "@/types/canvas";
import { getImageSize } from "@/utils/image";
import { Object as FabricObject, Path, classRegistry, XY, util, Image as FabricImage } from "fabric";
import { Textbox } from "@/extension/object/Textbox";
import { LinePoint } from "@/types/elements";
import { Image } from "@/extension/object/Image";
import { GifImage } from "@/extension/object/GifImage";
import { QRCode } from "@/extension/object/QRCode";
import { BarCode } from "@/extension/object/BarCode";
import { ArcText } from '@/extension/object/ArcText';
import { Polyline } from '@/extension/object/Polyline';
import { Circle, makeCurveCircle, makeCurvePoint } from '@/extension/object/Circle';
import { VerticalText } from '@/extension/object/VerticalText'
import JsBarcode from "jsbarcode";
import useCenter from "@/views/Canvas/useCenter";
import useCanvas from "@/views/Canvas/useCanvas";
import useCanvasZindex from "./useCanvasZindex";


export default () => {

  const mainStore = useMainStore();
  const templatesStore = useTemplatesStore();
  const { setZindex } = useCanvasZindex();
  const { rightState, fontOptions } = storeToRefs(mainStore);

  const getDefaultFontFamily = () => {
    // Find Roboto in the font options, or use the first available font
    const robotoFont = fontOptions.value.find(f => f.value === 'Roboto');
    return robotoFont?.value || fontOptions.value[0]?.value || 'Roboto';
  };

  const renderCanvas = (element: FabricObject) => {
    const [ canvas ] = useCanvas();
    // Default all new elements to show in export
    if ((element as any).showInExport === undefined) {
      (element as any).set('showInExport', true);
    }
    canvas.viewportCenterObject(element); 
    canvas.add(element);
    canvas.setActiveObject(element);
    rightState.value = RightStates.ELEMENT_STYLE;
    setZindex(canvas);
    canvas.renderAll();
    templatesStore.addElement(element);
  };

  const createTextElement = async (fontSize: number, textStyle = "transverse", textHollow = false, textValue = 'Double Click Edit Text') => {
    if (textStyle === "direction") {
      await createVerticalTextElement(fontSize, textHollow, textValue)
      return
    }
    const { centerPoint } = useCenter();
    const fontFamily = getDefaultFontFamily();
    // Ensure font is loaded before creating element
    await mainStore.ensureFontLoaded(fontFamily);
    const textBoxElement = new Textbox(textValue, {
      id: nanoid(10),
      left: centerPoint.x,
      top: centerPoint.y,
      fontSize,
      fontFamily,
      fillType: 0,
      hasControls: true,
      hasBorders: true,
      fontWeight: "normal",
      charSpacing: 0,
      opacity: 1,
      lineHeight: 1,
      originX: "left",
      originY: "top",
      textAlign: "center",
      name: ElementNames.TEXTBOX,
      width: fontSize * textValue.length / 2,
      splitByGrapheme: false
    });
    textBoxElement.set({ left: textBoxElement.left - textBoxElement.width / 2, top: textBoxElement.top - textBoxElement.height / 2, splitByGrapheme: false })
    if (textHollow) {
      textBoxElement.fill = "";
      textBoxElement.stroke = "black";
      textBoxElement.strokeWidth = 1;
    }
    renderCanvas(textBoxElement);
  };

  const createArcTextElement = (fontSize: number, textStyle = 'transverse', textHollow = false, textValue = 'Double Click Edit Text') => {
    const { centerPoint } = useCenter()
    const fontFamily = getDefaultFontFamily()
    mainStore.ensureFontLoaded(fontFamily)

    const textBoxElement = new ArcText(textValue, {
      id: nanoid(10),
      left: centerPoint.x,
      top: centerPoint.y,
      fontSize,
      fontFamily,
      fillType: 0,
      hasControls: true,
      hasBorders: true,
      fontWeight: 'normal',
      charSpacing: 3,
      opacity: 1,
      lineHeight: 1,
      originX: 'left',
      originY: 'top',
      textAlign: 'center',
      name: ElementNames.TEXTBOX,
      splitByGrapheme: textStyle === 'direction' ? true : false,
    })
    textBoxElement.set({ left: textBoxElement.left - textBoxElement.width / 2, top: textBoxElement.top - textBoxElement.height / 2 })
    if (textHollow) {
      textBoxElement.fill = ''
      textBoxElement.stroke = 'black'
      textBoxElement.strokeWidth = 1
    }
    renderCanvas(textBoxElement)
  }

  const createVerticalTextElement = async (fontSize: number, textHollow = false, textValue = 'Double Click Edit Text') => {
    const { centerPoint } = useCenter()
    const fontFamily = getDefaultFontFamily()
    await mainStore.ensureFontLoaded(fontFamily)

    const textBoxElement = new VerticalText(textValue, {
      id: nanoid(10),
      left: centerPoint.x,
      top: centerPoint.y,
      fontSize,
      fontFamily,
      fillType: 0,
      hasControls: true,
      hasBorders: true,
      fontWeight: 'normal',
      charSpacing: 3,
      opacity: 1,
      lineHeight: 1,
      originX: 'left',
      originY: 'top',
      name: ElementNames.VERTICALTEXT,
    })
    textBoxElement.set({ left: textBoxElement.left - textBoxElement.width / 2, top: textBoxElement.top - textBoxElement.height / 2 })
    if (textHollow) {
      textBoxElement.fill = "";
      textBoxElement.stroke = "black";
      textBoxElement.strokeWidth = 1;
    }
    renderCanvas(textBoxElement)
  }

  const createPathElement = (path: string, left?: number, top?: number) => {
    const { centerPoint } = useCenter();
    const pathElement = new Path(path, {
      id: nanoid(10),
      left: left ? left : centerPoint.x,
      top: top ? top : centerPoint.y,
      hasControls: true,
      hasBorders: true,
      opacity: 1,
      originX: "left",
      originY: "top",
      fill: "#ff5e17",
      name: ElementNames.PATH,
    });
    pathElement.left -= pathElement.width / 2;
    pathElement.top -= pathElement.height / 2;
    renderCanvas(pathElement);
  };

  const createLineElement = (path: XY[], startStyle: LinePoint, endStyle: LinePoint, strokeDashArray?: [number, number]) => {
    // const { centerPoint } = useCenter()
    // const lineElement = new Line([0, 0, 300, 0], {
    //   id: nanoid(10),
    //   left: centerPoint.x,
    //   top: centerPoint.y,
    //   strokeWidth: 4,
    //   stroke: 'green',
    //   scaleX: 1,
    //   scaleY: 1,
    //   originX: 'left',
    //   originY: 'top',
    //   transparentCorners: false,
    // })
    // renderCanvas(lineElement)
    // canvas.add(lineElement)
    // canvas.setActiveObject(lineElement)
    // rightState.value = RightStates.ELEMENT_STYLE
    // setZindex(canvas)
    createPolylineElement(path, startStyle, endStyle, strokeDashArray);
    // createArrowElement(path)
    // createCurverElement()
  };

  const createCurverElement = () => {
    const [ canvas ] = useCanvas();
    var line = new Path('M 65 0 Q 100, 100, 200, 0', { fill: '', stroke: 'black', objectCaching: false });

    line.path[0][1] = 100;
    line.path[0][2] = 100;

    line.path[1][1] = 200;
    line.path[1][2] = 200;

    line.path[1][3] = 300;
    line.path[1][4] = 100;
    console.log('path:', line.path)
    line.selectable = false;
    canvas.add(line);

    var p1 = makeCurvePoint(200, 200, null, line, null)
    p1.name = "p1";
    canvas.add(p1);

    var p0 = makeCurveCircle(100, 100, line, p1, null);
    p0.name = "p0";
    canvas.add(p0);

    var p2 = makeCurveCircle(300, 100, null, p1, line);
    p2.name = "p2";
    canvas.add(p2);
  }

  const createPolylineElement = (path: XY[], startStyle: LinePoint, endStyle: LinePoint, strokeDashArray?: [number, number]) => {
    const { centerPoint } = useCenter();
    // const points = [ { x: 0, y: 0 }, { x: 200, y: 0 } ]

    const element = new Polyline(path, {
      id: nanoid(10),
      left: centerPoint.x,
      top: centerPoint.y,
      strokeWidth: 4,
      stroke: "pink",
      fill: "",
      scaleX: 1,
      scaleY: 1,
      originX: "left",
      originY: "top",
      startStyle,
      endStyle,
      hasBorders: false,
      objectCaching: false,
      transparentCorners: false,
      strokeDashArray,
      name: ElementNames.LINE,
    });
    renderCanvas(element);
  };

  const createImageElement = async (url: string) => {
    const { zoom } = storeToRefs(useFabricStore());
    const { currentTemplateWidth, currentTemplateHeight } = storeToRefs(useTemplatesStore());
    const { centerPoint } = useCenter();
    const [canvas] = useCanvas();
    mainStore.startImageLoading();
    try {
      const { width, height } = await getImageSize(url);
      const scale = height / width;
      let imageScale = 1;
      if (scale < zoom.value && width > currentTemplateWidth.value) {
        imageScale = currentTemplateWidth.value / width;
      } else if (height > currentTemplateHeight.value) {
        imageScale = currentTemplateHeight.value / height;
      }
      const baseOptions = {
        id: nanoid(10),
        angle: 0,
        left: centerPoint.x - (width * imageScale) / 2,
        top: centerPoint.y - (height * imageScale) / 2,
        scaleX: imageScale,
        scaleY: imageScale,
        hasControls: true,
        hasBorders: true,
        opacity: 1,
        originX: "left" as const,
        originY: "top" as const,
        name: ElementNames.IMAGE,
        crossOrigin: "anonymous",
      };
      // GIFs are added as animated GifImage objects; everything else as a static Image.
      // GIFs use the 'gifimage' name so the right sidebar resolves the GIF style panel.
      const imageElement = GifImage.isGif(url)
        ? await GifImage.fromURL(url, { ...baseOptions, name: ElementNames.GIFIMAGE })
        : await Image.fromURL(url, {}, baseOptions);
      renderCanvas(imageElement);
    } catch (error) {
      console.error("Failed to load image", error);
    } finally {
      mainStore.finishImageLoading();
    }
  };

  const createQRCodeElement = async (url: string, codeOption: QRCodeOption, codeContent?: string) => {
    const { centerPoint } = useCenter();
    // const QRCode = classRegistry.getClass('QRCode')
    const codeObject = (await QRCode.fromURL(url, {}, {
      id: nanoid(10),
      name: ElementNames.QRCODE,
      angle: 0,
      left: centerPoint.x,
      top: centerPoint.y,
      hasControls: true,
      hasBorders: true,
      opacity: 1,
      originX: "left",
      originY: "top",
      borderColor: "#ff8d23",
      codeContent,
      codeOption,
      crossOrigin: "anonymous",
    })) as QRCodeElement;
    console.log("codeObject", codeObject);
    codeObject.left -= codeObject.width / 2;
    codeObject.top -= codeObject.height / 2;
    renderCanvas(codeObject);
  };

  const createBarCodeElement = async (url: string, codeContent: string, codeOption: JsBarcode.BaseOptions) => {
    const { centerPoint } = useCenter();
    // const Barcode = classRegistry.getClass('BarCode')
    const barcodeObject = await BarCode.fromURL(url, {}, {
      id: nanoid(10),
      name: ElementNames.BARCODE,
      angle: 0,
      left: centerPoint.x,
      top: centerPoint.y,
      hasControls: true,
      hasBorders: true,
      opacity: 1,
      originX: "left",
      originY: "top",
      borderColor: "#ff8d23",
      codeContent,
      codeOption,
      crossOrigin: "anonymous",
    });
    barcodeObject.left -= barcodeObject.width / 2;
    barcodeObject.top -= barcodeObject.height / 2;

    renderCanvas(barcodeObject);
  };

  const createMathElement = async (mathExpression: string, mathColor = '#000000', mathFontSize = 48, mathBackgroundColor = '#ffffff') => {
    const { centerPoint } = useCenter();
    
    try {
      // Import katex and html2canvas dynamically
      const katex = await import('katex');
      const html2canvas = (await import('html2canvas')).default;
      
      // Render to HTML string
      const htmlString = katex.default.renderToString(mathExpression, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });
      
      // Create a temporary div to render
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.fontSize = `${mathFontSize}px`;
      tempDiv.style.color = mathColor;
      tempDiv.style.backgroundColor = mathBackgroundColor;
      tempDiv.style.display = 'inline-block';
      tempDiv.style.padding = '10px';
      tempDiv.innerHTML = htmlString;
      document.body.appendChild(tempDiv);
      
      // Wait for fonts to load
      await document.fonts.ready;
      
      // Use html2canvas to convert the div to canvas
      const canvas2d = await html2canvas(tempDiv, {
        backgroundColor: mathBackgroundColor,
        scale: 3, // Higher scale for better quality
        logging: false,
        allowTaint: false,
        useCORS: true,
      });
      
      // Get the data URL from canvas
      const dataURL = canvas2d.toDataURL('image/png');
      
      // Clean up temp div
      document.body.removeChild(tempDiv);
      
      // Import Math class
      const { Math: MathClass } = await import('@/extension/object/Math');
      
      // Create the Math element
      const mathObject = await MathClass.fromURL(dataURL, {}, {
        id: nanoid(10),
        name: ElementNames.MATH,
        angle: 0,
        left: centerPoint.x,
        top: centerPoint.y,
        hasControls: true,
        hasBorders: true,
        opacity: 1,
        originX: "left",
        originY: "top",
        borderColor: "#ff8d23",
        mathExpression,
        mathColor,
        mathFontSize,
        mathBackgroundColor,
        crossOrigin: "anonymous",
      });
      
      mathObject.left -= mathObject.width / 2;
      mathObject.top -= mathObject.height / 2;
      
      renderCanvas(mathObject);
    } catch (error) {
      console.error('Failed to create math element:', error);
      throw error;
    }
  };

  const createVideoElement = (url: string) => {
    const { centerPoint } = useCenter();
    const [canvas] = useCanvas();
    const videoEl = document.createElement("video");
    videoEl.loop = true;
    videoEl.crossOrigin = "anonymous";
    videoEl.controls = true;
    videoEl.style.display = "none";

    const sourceEl = document.createElement("source");
    sourceEl.src = url;
    videoEl.appendChild(sourceEl);

    videoEl.addEventListener("loadeddata", function () {
      videoEl.width = videoEl.videoWidth;
      videoEl.height = videoEl.videoHeight;
      const videoElement = new FabricImage(videoEl, {
        left: centerPoint.x,
        top: centerPoint.y,
        originX: "center",
        originY: "center",
        objectCaching: false,
      });
      canvas.add(videoElement);
      const viedoSource = videoElement.getElement() as any
      viedoSource.play();
      util.requestAnimFrame(function render() {
        canvas.renderAll();
        util.requestAnimFrame(render);
      });
    });
  };

  const createTextWithStyle = async (options: {
    fontSize: number
    fontWeight?: string
    textTransform?: string
    charSpacing?: number
    textStyle?: string
    hollow?: boolean
    textValue?: string
    fontFamily?: string
  }) => {
    const {
      fontSize,
      fontWeight = 'normal',
      textTransform,
      charSpacing = 0,
      textStyle = 'transverse',
      hollow = false,
      textValue = 'Double Click Edit Text',
      fontFamily: customFontFamily
    } = options

    if (textStyle === 'direction') {
      await createVerticalTextElement(fontSize, hollow, textValue)
      return
    }

    const { centerPoint } = useCenter()
    const fontFamily = customFontFamily || getDefaultFontFamily()
    // Font should already be loaded before calling this function
    // but ensure it's loaded just in case
    await mainStore.ensureFontLoaded(fontFamily)
    
    const textBoxElement = new Textbox(textValue, {
      id: nanoid(10),
      left: centerPoint.x,
      top: centerPoint.y,
      fontSize,
      fontFamily,
      fontWeight: fontWeight as any,
      fillType: 0,
      hasControls: true,
      hasBorders: true,
      charSpacing,
      opacity: 1,
      lineHeight: 1,
      originX: 'left',
      originY: 'top',
      textAlign: 'center',
      name: ElementNames.TEXTBOX,
      splitByGrapheme: false
    })
    
    textBoxElement.set({ 
      left: textBoxElement.left - textBoxElement.width / 2, 
      top: textBoxElement.top - textBoxElement.height / 2, 
      splitByGrapheme: false 
    })
    
    if (hollow) {
      textBoxElement.fill = ''
      textBoxElement.stroke = 'black'
      textBoxElement.strokeWidth = 1
    }
    
    renderCanvas(textBoxElement)
  }

  return {
    createTextElement,
    createTextWithStyle,
    createPathElement,
    createLineElement,
    createImageElement,
    createQRCodeElement,
    createBarCodeElement,
    createMathElement,
    createVideoElement,
    createArcTextElement,
    createVerticalTextElement,
  };
};
