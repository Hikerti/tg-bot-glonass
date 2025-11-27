async function tgUploadToS3(
    bot: Telegraf<Context>,
    config: ConfigService,
    msg: Message
) {
const fileId = extractMediaFileId(msg);
if (!fileId) return null;


const tgFile = await bot.telegram.getFile(fileId);
const filePath = (tgFile && (tgFile as any).file_path) as string;
if (!filePath) return null;


const token = config.get<string>('ADMIN_BOT_TOKEN');
const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;


const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });

const uploadResp = await axios.post(
`${config.get<string>('GATE_URL')}/upload`,
fileResp.data,
{ headers: { 'Content-Type': 'application/octet-stream' } }
);

return uploadResp.data?.url ?? uploadResp.data ?? null;
}
    
export function extractMediaFileId(msg: Message): string | null {
    if ("photo" in msg) return msg.photo[msg.photo.length - 1].file_id;
    if ("video" in msg) return msg.video.file_id;
    if ("audio" in msg) return msg.audio.file_id;
    if ("document" in msg) return msg.document.file_id;
    return null;
}