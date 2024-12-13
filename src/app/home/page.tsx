"use client"
import { Layout, Button, Upload, message, UploadProps, GetProp, Image as AntdImage, List, Typography } from 'antd';
import { Space, Table, Row, Col } from 'antd';
import type { TableProps } from 'antd';

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

function TableComponent(props: { imageName: string, data: DataType[] }) {


  const downloadImage = (format = 'webp', value = '') => {
    const link = document.createElement('a');
    link.download = `${props.imageName}.${format}`;
    link.href = value;
    link.click();
  };


  async function createZipFile(imageDataURLs: string[]): Promise<Blob> {
    const zip = new JSZip();

    for (const dataURL of imageDataURLs) {
      const blob = dataURLToBlob(dataURL);
      const format = blob.type.split('/')[1]
      const filename = `${props.imageName}.${format}`;
      zip.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  }

  function downloadZipFile(zipBlob: Blob) {
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${props.imageName}.zip`);
    // document.body.appendChild(link); // TODO: Test if this is needed
    link.click();
    // document.body.removeChild(link);  // TODO: Test if this is needed
    URL.revokeObjectURL(url);
  }

  const downloadAllImages = async () => {
    const zipBlob = await createZipFile(Object.values(props.data[0]));
    downloadZipFile(zipBlob);
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
      render: (text) => props.imageName,
    },
    {
      title: 'WEBP',
      dataIndex: 'webp',
      key: 'webp',
      render: (imageUrl, record) => {
        return (
          < RenderImageTableCell imageUrl={imageUrl} />
        );
      }
    },
    {
      title: 'PNG',
      dataIndex: 'png',
      key: 'png',
      render: (imageUrl, record) => {
        return (
          < RenderImageTableCell imageUrl={imageUrl} />
        );
      }
    },
    {
      title: 'JPEG',
      dataIndex: 'jpeg',
      key: 'jpeg',
      render: (imageUrl, record) => {
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
          <a onClick={() => downloadAllImages()}>Download All Images</a>
          <a>Delete</a>
        </Space>
      ),
    },
  ];

  const data = props.data.map((dataObj) => ({
    // TODO: Clean this up!
    name: props.imageName,
    webp: dataObj['image/webp'],
    png: dataObj['image/png'],
    jpeg: dataObj['image/jpeg'],
  })) || [];// Compose to datat that can be used with the table


  return (
    <Table columns={columns} dataSource={data} style={{ overflow: 'scroll' }}/>
  )
}


function ContentComponent() {

  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageOutputs, setImageOutputs] = useState<DataType>({});


  const props: UploadProps = {
    name: 'file',
    action: '', // Empty string to prevent uploading to a server

    beforeUpload,
    async onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        const imgDataUrl = await getBase64(info.file.originFileObj as FileType);
        setImageUrl(imgDataUrl);
        setImageName(info.file.name.split('.')[0]);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    showUploadList: false,
  };

  function onPreviewImageLoaded(evt: SyntheticEvent<HTMLImageElement>) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx?.drawImage(img, 0, 0);

    const vals = SUPPORTED_OUTPUT_FORMATS.reduce((acc, val) => {
      acc[val] = canvas.toDataURL(val);
      return acc;
    }, {} as Record<string, string>);
    setImageOutputs(vals);
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

      {imageUrl ? 
       
       <>
        <div style={{ margin: '32px' }} />
        <AntdImage 
          style={{ maxWidth: '480px', maxHeight: '480px' }}
          src={imageUrl}
          onLoad={onPreviewImageLoaded}
          alt="avatar" 
          />
        <div style={{ margin: '32px' }} />
       </>: null}
        

      {
        !!Object.keys(imageOutputs).length && (
          <>            
            <TableComponent data={[imageOutputs]} imageName={imageName} />
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