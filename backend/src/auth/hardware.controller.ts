import { Controller, Post, Body } from "@nestjs/common";

@Controller("hardware")
export class HardwareController {

  @Post("alerta")
  recibirAlerta(@Body() body: { alerta: boolean }) {

    if (body.alerta) {
      console.log("ALERTA AL HARDWARE – Entrega finalizada");
    }

    return { status: "ok", recibido: body.alerta };
  }
}
