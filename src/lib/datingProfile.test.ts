import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {apiMock}=vi.hoisted(()=>({apiMock:vi.fn()}));
vi.mock('./api',async importOriginal=>{
  const actual=await importOriginal<typeof import('./api')>();
  return {...actual,api:apiMock};
});

import { datingProfileApi, validateDatingPhoto } from './datingProfile';

describe('dating profile API contract',()=>{
  beforeEach(()=>apiMock.mockReset());
  afterEach(()=>vi.unstubAllGlobals());

  it('loads editing state from the authenticated profile endpoint',async()=>{
    apiMock.mockResolvedValue({});
    await datingProfileApi.get();
    expect(apiMock).toHaveBeenCalledWith('/api/v1/me/dating-profile');
  });

  it('replaces profile collections through PATCH',async()=>{
    apiMock.mockResolvedValue({});
    const prompts=[{prompt:'A perfect Sunday…',answer:'Coffee and a long walk.',position:0}];
    await datingProfileApi.patch({prompts});
    expect(apiMock).toHaveBeenCalledWith('/api/v1/me/dating-profile',{
      method:'PATCH',
      body:JSON.stringify({prompts}),
    });
  });

  it('validates photo types before upload',()=>{
    expect(validateDatingPhoto(new File(['hello'],'profile.txt',{type:'text/plain'}))).toContain('JPEG');
    expect(validateDatingPhoto(new File(['image'],'profile.heic',{type:''}))).toBeNull();
  });

  it('posts signed fields and the file directly to Cloudinary before registration',async()=>{
    const file=new File(['image'],'profile.webp',{type:'image/webp'});
    apiMock
      .mockResolvedValueOnce({upload_url:'https://uploads.example.test',fields:{api_key:'123',timestamp:456,signature:'signed'}})
      .mockResolvedValueOnce({id:'photo-1'});
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({public_id:'astromatch/users/opaque/photo-1'}),{
      status:200,
      headers:{'Content-Type':'application/json'},
    }));
    vi.stubGlobal('fetch',fetchMock);

    await datingProfileApi.uploadPhoto(file,'Profile photo');

    const cloudinaryOptions=fetchMock.mock.calls[0][1] as RequestInit;
    const body=cloudinaryOptions.body as FormData;
    expect(fetchMock).toHaveBeenCalledWith('https://uploads.example.test',{method:'POST',body});
    expect(body.get('api_key')).toBe('123');
    expect(body.get('timestamp')).toBe('456');
    expect(body.get('signature')).toBe('signed');
    expect(body.get('file')).toBe(file);
    expect(apiMock).toHaveBeenLastCalledWith('/api/v1/me/dating-profile/photos',{
      method:'POST',
      body:JSON.stringify({public_id:'astromatch/users/opaque/photo-1',alt:'Profile photo'}),
    });
  });

  it('sends the complete ordered photo id list',async()=>{
    apiMock.mockResolvedValue([]);
    await datingProfileApi.orderPhotos(['photo-2','photo-1']);
    expect(apiMock).toHaveBeenCalledWith('/api/v1/me/dating-profile/photos/order',{
      method:'PUT',
      body:JSON.stringify({photo_ids:['photo-2','photo-1']}),
    });
  });
});
