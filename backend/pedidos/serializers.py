from rest_framework import serializers
from .models import Pedido, ArchivoAdjunto


class ArchivoAdjuntoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAdjunto
        fields = ['id', 'nombre', 'url']


class PedidoSerializer(serializers.ModelSerializer):
    archivos = ArchivoAdjuntoSerializer(many=True, read_only=True)
    fecha = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S')
    seña = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    importe = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'telefono', 'color', 'anillado',
            'caras', 'distribucion', 'seña', 'importe', 'notas',
            'estado', 'fecha', 'orden', 'archivos'
        ]