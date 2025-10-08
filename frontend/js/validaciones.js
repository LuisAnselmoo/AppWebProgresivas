// Validaciones para login
export function validarLogin(body) {
    // Extraer datos del body de la petición
    const { correo, password } = body;

    // Validar que todos los campos estén llenos
    if (!correo || !password) {
        return { ok: false, message: 'Faltan datos requeridos' };
    }

    // Validar formato de correo
    if (!/^\S+@\S+\.\S+$/.test(correo)) {
        return { ok: false, message: 'Correo inválido' };
    }

    // mandamos que todo está bien
    return { ok: true };
}

// Validaciones para registro
export function validarRegistro(body) {
    const { nombre, apellidoPaterno, apellidoMaterno, correo, telefono, pass1, pass2 } = body;

    // Validar que todos los campos estén llenos
    if (!nombre || !apellidoPaterno || !apellidoMaterno || !correo || !telefono || !pass1) {
        return { ok: false, message: 'Faltan datos requeridos' };
    }

    // Validar si las contraseñas son iguales
    if (pass1 !== pass2) {
        return { ok: false, message: 'Las contraseñas no coinciden' };
    }

    // Validar que nombre y apellidos solo contengan letras y espacios
    const validarTexto = /^[a-zA-Z\s]+$/;
    if (!validarTexto.test(nombre)) return { ok: false, message: 'El nombre contiene caracteres inválidos' };
    if (!validarTexto.test(apellidoPaterno)) return { ok: false, message: 'El apellido paterno contiene caracteres inválidos' };
    if (!validarTexto.test(apellidoMaterno)) return { ok: false, message: 'El apellido materno contiene caracteres inválidos' };

    // Validar formato de correo
    if (!/^\S+@\S+\.\S+$/.test(correo)) {
        return { ok: false, message: 'Correo inválido' };
    }

    // Validar teléfono (10 a 15 dígitos)
    if (!/^\d{10,15}$/.test(telefono)) {
        return { ok: false, message: 'Teléfono inválido' };
    }
    
    // Validar contraseña mínima
    if (pass1.length < 6) {
        return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // mandamos que todo está bien
    return { ok: true };
}