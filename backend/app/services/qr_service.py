import base64
import io

import qrcode
from qrcode.constants import ERROR_CORRECT_H


def generate_qr_code(url: str) -> str:
    """
    Generate a QR code for the given URL and return it as a base64-encoded
    PNG data URL in the format: "data:image/png;base64,<data>".

    Uses high error correction (ERROR_CORRECT_H) so the QR code remains
    scannable even if partially obscured (e.g. with a logo overlay).
    """
    qr = qrcode.QRCode(
        version=None,  # auto-determine size
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    b64_data = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{b64_data}"
