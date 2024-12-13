"use client"
import { Layout, Button, Upload, message, UploadProps, GetProp, Image as AntdImage, Divider } from 'antd';
import { Space, Table, Row, Col } from 'antd';

const { Dragger } = Upload;
const { Header, Footer, Content } = Layout;

import { UploadOutlined, InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import { SyntheticEvent, useState } from 'react';
import JSZip from 'jszip';


const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 48,
  lineHeight: '64px',
  backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#0958d9',
  margin: '12px',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};

const layoutStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100%)',
  maxWidth: 'calc(100%)',
};

interface DataType {
  key?: string;
  web?: string;
  png?: string;
  jpeg?: string;
}

interface RawDataType {
  key?: string;
  'image/webp'?: string;
  'image/jpeg'?: string;
  'image/png'?: string;
  name?: string
}

function dataURLToBlob(dataURL: string) {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch && mimeMatch[1] || '';
  const binary = atob(parts[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: mime });
}

const SUPPORTED_OUTPUT_FORMATS = ['image/webp', 'image/jpeg', 'image/png',];

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const beforeUpload = (file: FileType) => {

  const isSupportedImage = SUPPORTED_OUTPUT_FORMATS.includes(file.type);
  if (!isSupportedImage) {
    message.error('You can only upload JPG/PNG/WEBP file!');
  }
  return isSupportedImage;
};

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function LayoutComponent(props: { children: React.ReactNode }) {
  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}><h1>Very Simple Image Converter</h1></Header>
      {props.children}
      <Footer style={footerStyle}>Random Footer</Footer>
    </Layout>
  );
}

function TableComponent(props: { data: RawDataType[], deleteImageGroup: (name: string) => void }) {


  const downloadImage = (format = 'webp', imageName: string, value = '') => {
    const link = document.createElement('a');
    link.download = `${imageName}.${format}`;
    link.href = value;
    link.click();
  };


  async function createZipFile(imageDataURLs: string[], imageName: string): Promise<Blob> {
    const zip = new JSZip();

    for (const dataURL of imageDataURLs) {
      const blob = dataURLToBlob(dataURL);
      const format = blob.type.split('/')[1]
      const filename = `${imageName}.${format}`;
      zip.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  }

  function downloadZipFile(zipBlob: Blob, imageName: string) {
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${imageName}.zip`);
    // document.body.appendChild(link); // TODO: Test if this is needed
    link.click();
    // document.body.removeChild(link);  // TODO: Test if this is needed
    URL.revokeObjectURL(url);
  }

  const downloadAllImages = async (name: string) => {
    const imageGroup = props.data.find((obj) => obj.name === name);
    const {name: namez = '', ...rest} = imageGroup || {};
    const zipBlob = await createZipFile(Object.values(rest), name);
    downloadZipFile(zipBlob, name);
  }

  function RenderImageTableCell(props: { imageUrl: string }) {
    const { imageUrl } = props
    return (
      <>
        <AntdImage width={200} src={imageUrl} alt="avatar" />
        <Button style={{ width: '100%' }} type="primary" onClick={() => downloadImage('webp', imageUrl)} icon={<DownloadOutlined />}>Click to Download</Button>
      </>
    );
  }

  type TableColumn = {
    title: string;
    dataIndex?: string;
    key: string;
    render?: (imageUrl: string, record: any) => React.ReactNode;
  };

  const columns: TableColumn[] = [
    {
      title: 'Image Name',
      dataIndex: 'name',
      key: 'name',
      render: (_text, record) => record.name,
    },
    {
      title: 'WEBP',
      dataIndex: 'webp',
      key: 'webp',
      render: (imageUrl, _record) => {
        return (
          < RenderImageTableCell imageUrl={imageUrl} />
        );
      }
    },
    {
      title: 'PNG',
      dataIndex: 'png',
      key: 'png',
      render: (imageUrl, _record) => {
        return (
          < RenderImageTableCell imageUrl={imageUrl} />
        );
      }
    },
    {
      title: 'JPEG',
      dataIndex: 'jpeg',
      key: 'jpeg',
      render: (imageUrl, _record) => {
        return (
          < RenderImageTableCell imageUrl={imageUrl} />
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => downloadAllImages(record.name)}>Download All Images</a>
          <a onClick={() => props.deleteImageGroup(record.name)}>Delete</a>
        </Space>
      ),
    },
  ];


  const data = props.data.map((dataObj) => ({
    // TODO: Clean this up!
    name: dataObj.name,
    webp: dataObj['image/webp'],
    png: dataObj['image/png'],
    jpeg: dataObj['image/jpeg'],
  })) || [];// Compose to datat that can be used with the table


  return (
    <Table columns={columns} dataSource={data} style={{ overflow: 'scroll' }} />
  )
}


interface InputImageData {
  name: string;
  image: string;
}

function ContentComponent() {

  const [imageInputs, setImageInputs] = useState<InputImageData[]>([]);
  const [imageOutputs, setImageOutputs] = useState<RawDataType[]>([]);


  const props: UploadProps = {
    name: 'file',
    action: '', // Empty string to prevent uploading to a server
    accept: SUPPORTED_OUTPUT_FORMATS.join(', '),
    multiple: true,

    beforeUpload,
    async onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        const imgDataUrl = await getBase64(info.file.originFileObj as FileType);
        const name = info.file.name.split('.')[0];
        setImageInputs((oldImageInputs) => [...oldImageInputs, { name, image: imgDataUrl }]);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    showUploadList: false,
  };

  function onPreviewImageLoaded(_evt: SyntheticEvent<HTMLImageElement>, imageData: InputImageData, index: number) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageData.image;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx?.drawImage(img, 0, 0);

    const vals = { name: imageData.name }

    SUPPORTED_OUTPUT_FORMATS.reduce((acc, val) => {
      acc[val] = canvas.toDataURL(val);
      return acc;
    }, vals as Record<string, string>);

    setImageOutputs((oldImageOutputs) => [...oldImageOutputs, vals]);
  }

  function deleteImageGroup(name: string) {
    setImageOutputs((oldImageOutputs) => oldImageOutputs.filter((image) => image.name !== name));
    setImageInputs((oldImageInputs) => oldImageInputs.filter((input) => input.name !== name));
  }

  return (
    <Content style={contentStyle}>
      <Row>
        <Col xs={24} sm={24} md={12}>
          <h2>Upload your image here</h2>
          <Upload {...props}>
            <Button shape="round" icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single or bulk image upload.
            </p>
          </Dragger>
        </Col>
      </Row>

      {imageInputs.length ?
        <>
          <div style={{ margin: '32px', backgroundColor: 'rgba(0, 0, 0, 0.1)'}}>
            <Divider />
            <AntdImage.PreviewGroup>
              {imageInputs.map((imageData, index) => (
                <AntdImage
                  key={imageData.name}
                  style={{ maxWidth: '120px', maxHeight: '120px', margin: '24px' , borderRadius: '8px' }}
                  src={imageData.image}
                  onLoad={(evt) => onPreviewImageLoaded(evt, imageData, index)}
                  alt="avatar"
                  preview={{
                    src: imageData.image,
                  }}
                />
              ))}

            </AntdImage.PreviewGroup>
          </div>
        </> : null}


      {
        !!imageOutputs.length && (
          <>
            <TableComponent data={imageOutputs} deleteImageGroup={deleteImageGroup} />
          </>
        )
      }

    </Content>
  );
}

function Home() {
  return (
    <LayoutComponent>
      <ContentComponent />
    </LayoutComponent>
  )
}



export default Home;