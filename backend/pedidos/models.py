from django.db import models
import uuid


class Pedido(models.Model):
    COLOR_CHOICES = [('ByN', 'Blanco y Negro'), ('Color', 'Color')]
    CARAS_CHOICES = [('Simple', 'Simple'), ('Doble', 'Doble')]
    DISTRIBUCION_CHOICES = [('Normal', 'Normal'), ('Apaisada', 'Apaisada')]
    ESTADO_CHOICES = [
        ('Nuevo', 'Nuevo'),
        ('En proceso', 'En proceso'),
        ('Terminado', 'Terminado'),
        ('Cliente Avisado', 'Cliente Avisado'),
        ('Entregado', 'Entregado'),
    ]

    cliente = models.CharField(max_length=200)
    telefono = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=10, choices=COLOR_CHOICES, default='ByN')
    anillado = models.BooleanField(default=False)
    caras = models.CharField(max_length=10, choices=CARAS_CHOICES, default='Simple')
    distribucion = models.CharField(max_length=10, choices=DISTRIBUCION_CHOICES, default='Normal')
    seña = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    importe = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notas = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Nuevo')
    fecha = models.DateTimeField(auto_now_add=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden', '-fecha']
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'

    def __str__(self):
        return f'{self.cliente} — {self.estado}'


class ArchivoAdjunto(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='archivos')
    nombre = models.CharField(max_length=255)
    url = models.TextField()

    def __str__(self):
        return self.nombre