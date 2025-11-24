import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";


@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".env/gate/mail.env", isGlobal: true,
        })
    ]
})

export class EmailModule {}