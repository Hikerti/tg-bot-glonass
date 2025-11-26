
export async tgSendFile(msg: Message, ctx: Scenes.WizardContext, bot: Telegraf<Context>, ) { 
        if (!msg || (!("photo" in msg) && !("video" in msg) && !("audio" in msg) && !("document" in msg))) {
                        return ctx.reply("Отправьте файл (фото/видео/аудио/документ).");
                    }
        
                    let fileId: string;
                    if ("photo" in msg) fileId = msg.photo[msg.photo.length - 1].file_id;
                    else if ("video" in msg) fileId = msg.video.file_id;
                    else if ("audio" in msg) fileId = msg.audio.file_id;
                    else if ("document" in msg) fileId = msg.document.file_id;
                    else return;
        
                    const tgFile = await this.bot.telegram.getFile(fileId);
                    const fileUrl = `https://api.telegram.org/file/bot${this.config.get("ADMIN_BOT_TOKEN")}/${tgFile.file_path}`;
        
                    const fileResp = await axios.get(fileUrl, { responseType: "arraybuffer" });
        
                    const uploadResp = await axios.post(
                        `${this.config.get<string>("GATE_URL")}/upload`,
                        fileResp.data,
                        {
                            headers: { "Content-Type": "application/octet-stream" }
                        }
        );
        
        return uploadResp.data
    }